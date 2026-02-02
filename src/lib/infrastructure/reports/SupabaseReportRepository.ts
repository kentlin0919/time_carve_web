import { supabase as defaultClient } from "@/lib/supabase";
import { ReportRepository, ReportStats, RevenueTrend, CourseRevenueDistribution, TransactionFilter, Transaction } from "@/lib/domain/reports/ReportRepository";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseReportRepository implements ReportRepository {
  private supabase: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.supabase = client || defaultClient;
  }

  private isPaid(statusKey: string): boolean {
    return ['completed', 'confirmed'].includes(statusKey);
  }

  async getStats(teacherId: string, startDate: Date, endDate: Date): Promise<ReportStats> {
    // Calculate previous period
    const duration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - duration);
    const prevEndDate = new Date(startDate.getTime()); // Overlaps exactly? Usually strictly less.
    // Actually, report usually compares "Last Month" vs "Current Month".
    // If range is arbitrary, exact shift is fine.

    // Fetch ALL relevant bookings for both periods to minimize queries?
    // Or just two queries.
    // Query 1: Current Period
    const { data: currentData, error: currentError } = await this.supabase
      .from('bookings')
      .select(`
        id,
        price,
        booking_date,
        student_id,
        booking_statuses!inner(status_key)
      `)
      .eq('teacher_id', teacherId)
      .gte('booking_date', startDate.toISOString())
      .lte('booking_date', endDate.toISOString());

    if (currentError) throw new Error(`Failed to fetch current stats: ${currentError.message} (Details: ${currentError.details || 'none'}, Hint: ${currentError.hint || 'none'})`);

    // Query 2: Previous Period
    const { data: prevData, error: prevError } = await this.supabase
      .from('bookings')
      .select(`
        id,
        price,
        booking_date,
        student_id,
        booking_statuses!inner(status_key)
      `)
      .eq('teacher_id', teacherId)
      .gte('booking_date', prevStartDate.toISOString())
      .lt('booking_date', startDate.toISOString());

    if (prevError) throw new Error(`Failed to fetch previous stats: ${prevError.message} (Details: ${prevError.details || 'none'}, Hint: ${prevError.hint || 'none'})`);

    const calc = (bookings: any[]) => {
      const paidBookings = bookings.filter(b => {
        const status = Array.isArray(b.booking_statuses) ? b.booking_statuses[0] : b.booking_statuses;
        return this.isPaid(status?.status_key);
      });
      const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.price || 0), 0);
      const totalSessions = paidBookings.length;
      const averageOrderValue = totalSessions > 0 ? totalRevenue / totalSessions : 0;
      const activeStudents = new Set(paidBookings.map(b => b.student_id)).size;
      return { totalRevenue, totalSessions, averageOrderValue, activeStudents };
    };

    const currentById = calc(currentData || []);
    const prevById = calc(prevData || []);

    const growth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      totalRevenue: currentById.totalRevenue,
      totalSessions: currentById.totalSessions,
      averageOrderValue: currentById.averageOrderValue,
      activeStudents: currentById.activeStudents,
      totalRevenueGrowth: growth(currentById.totalRevenue, prevById.totalRevenue),
      totalSessionsGrowth: growth(currentById.totalSessions, prevById.totalSessions),
      averageOrderValueGrowth: growth(currentById.averageOrderValue, prevById.averageOrderValue),
      activeStudentsGrowth: growth(currentById.activeStudents, prevById.activeStudents),
    };
  }

  async getRevenueTrends(teacherId: string, range: '6_months' | 'year'): Promise<RevenueTrend[]> {
    const now = new Date();
    let startDate: Date;
    if (range === '6_months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1); // This year
    }

    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        price,
        booking_date,
        booking_statuses!inner(status_key)
      `)
      .eq('teacher_id', teacherId)
      .gte('booking_date', startDate.toISOString());

    if (error) throw new Error(`Failed to fetch revenue trends: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);

    const monthlyRevenue: Record<string, number> = {};

    // Initialize months
    let iter = new Date(startDate);
    while (iter <= now) {
      const key = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = 0;
      iter.setMonth(iter.getMonth() + 1);
    }

    data?.forEach(b => {
      const status = Array.isArray(b.booking_statuses) ? b.booking_statuses[0] : b.booking_statuses;
      if (!this.isPaid(status?.status_key)) return;
      // booking_date is YYYY-MM-DD
      const date = new Date(b.booking_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += (b.price || 0);
      }
    });

    return Object.entries(monthlyRevenue).map(([label, amount]) => ({
      label,
      amount
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  async getCourseRevenueDistribution(teacherId: string): Promise<CourseRevenueDistribution[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        price,
        course:courses(title),
        booking_statuses!inner(status_key)
      `)
      .eq('teacher_id', teacherId);

    if (error) throw new Error(`Failed to fetch course revenue: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);

    const distribution: Record<string, number> = {};
    let total = 0;

    data?.forEach(b => {
      const status = Array.isArray(b.booking_statuses) ? b.booking_statuses[0] : b.booking_statuses;
      if (!this.isPaid(status?.status_key)) return;
      const title = (b.course as any)?.title || 'Unknown Course';
      const price = b.price || 0;
      distribution[title] = (distribution[title] || 0) + price;
      total += price;
    });

    // Convert to percentage? Or amount. The type says "value: percentage or amount". Let's return amount for flexibility, or calc % here.
    // UI usually shows amount.
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }

  async getTransactions(teacherId: string, filter: TransactionFilter): Promise<{ data: Transaction[]; total: number }> {
    let query = this.supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        price,
        course:courses(title, course_type),
        student:student_info(
          user:user_info(name, avatar_url)
        ),
        booking_statuses!inner(status_key)
      `, { count: 'exact' })
      .eq('teacher_id', teacherId);

    // Filter by completed status for "Transactions" report usually? Or all?
    // "Revenue Details" usually implies money received.
    query = query.in('booking_statuses.status_key', ['completed', 'confirmed']);

    if (filter.startDate) query = query.gte('booking_date', filter.startDate.toISOString());
    if (filter.endDate) query = query.lte('booking_date', filter.endDate.toISOString());
    // Search? Supabase doesn't easily search across joined tables deep nested.
    // We can search course title or student name if we flatten or text search is setup.
    // For now, simple client side filter or assuming minimal search needed?
    // Actually, listing recent transactions is key.

    // Pagination
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order('booking_date', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to fetch transactions: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);

    const transactions = (data || []).map((b: any) => ({
      id: b.id,
      date: b.booking_date,
      studentName: b.student?.user?.name || 'Unknown',
      studentAvatar: b.student?.user?.avatar_url,
      courseTitle: b.course?.title || 'Unknown',
      courseType: b.course?.course_type || 'General',
      amount: b.price || 0,
    }));

    return { data: transactions, total: count || 0 };
  }
}
