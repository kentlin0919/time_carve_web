import { supabase as defaultClient } from "@/lib/supabase";
import { ReportRepository, ReportStats, RevenueTrend, CourseRevenueDistribution, TransactionFilter, Transaction } from "@/lib/domain/reports/ReportRepository";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseReportRepository implements ReportRepository {
  private supabase: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.supabase = client || defaultClient;
  }

  private toNumber(val: unknown): number {
    if (typeof val === "number") return val;
    if (typeof val === "string" && val.trim() !== "") {
      const n = Number(val);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }

  private resolveAmount(row: any): number {
    const bookingPrice = this.toNumber(row?.price);
    const coursePrice = this.toNumber((row?.course as any)?.price);
    // bookings.price defaults to 0 when not set; treat 0 as "unset"
    return bookingPrice > 0 ? bookingPrice : coursePrice;
  }

  private isPaid(statusKey: string): boolean {
    return ['completed', 'confirmed'].includes(statusKey);
  }

  async getStats(teacherId: string, startDate: Date, endDate: Date): Promise<ReportStats> {
    // Calculate previous period (inclusive day range)
    const oneDayMs = 24 * 60 * 60 * 1000;
    const durationDays =
      Math.floor((endDate.getTime() - startDate.getTime()) / oneDayMs) + 1;
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - durationDays);
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);

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
        course:courses(price),
        booking_statuses!inner(status_key)
      `)
      .eq('teacher_id', teacherId)
      .gte('booking_date', startDate.toISOString().slice(0, 10))
      .lte('booking_date', endDate.toISOString().slice(0, 10));

    if (currentError) throw new Error(`Failed to fetch current stats: ${currentError.message} (Details: ${currentError.details || 'none'}, Hint: ${currentError.hint || 'none'})`);

    // Query 2: Previous Period
    const { data: prevData, error: prevError } = await this.supabase
      .from('bookings')
      .select(`
        id,
        price,
        booking_date,
        student_id,
        course:courses(price),
        booking_statuses!inner(status_key)
      `)
      .eq('teacher_id', teacherId)
      .gte('booking_date', prevStartDate.toISOString().slice(0, 10))
      .lte('booking_date', prevEndDate.toISOString().slice(0, 10));

    if (prevError) throw new Error(`Failed to fetch previous stats: ${prevError.message} (Details: ${prevError.details || 'none'}, Hint: ${prevError.hint || 'none'})`);

    const calc = (bookings: any[]) => {
      const paidBookings = bookings.filter(b => {
        const status = Array.isArray(b.booking_statuses) ? b.booking_statuses[0] : b.booking_statuses;
        return this.isPaid(status?.status_key);
      });
      const totalRevenue = paidBookings.reduce((sum, b) => {
        return sum + this.resolveAmount(b);
      }, 0);
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
        course:courses(price),
        booking_statuses!inner(status_key)
      `)
      .eq('teacher_id', teacherId)
      .gte('booking_date', startDate.toISOString().slice(0, 10));

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
      // booking_date is YYYY-MM-DD (avoid timezone shifts)
      const dateStr = String(b.booking_date);
      const [year, month] = dateStr.split("-");
      const key = year && month ? `${year}-${month}` : "";
      if (monthlyRevenue[key] !== undefined) {
        monthlyRevenue[key] += this.resolveAmount(b);
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
        course:courses(title, price),
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
      const amount = this.resolveAmount(b);
      distribution[title] = (distribution[title] || 0) + amount;
      total += amount;
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
        student_id,
        course_id,
        course:courses(title, course_type, price),
        student:student_info(
          user:user_info(name, avatar_url)
        ),
        booking_statuses!inner(status_key)
      `, { count: 'exact' })
      .eq('teacher_id', teacherId);

    // Filter by completed status for "Transactions" report
    query = query.in('booking_statuses.status_key', ['completed', 'confirmed']);

    if (filter.startDate) query = query.gte('booking_date', filter.startDate.toISOString().slice(0, 10));
    if (filter.endDate) query = query.lte('booking_date', filter.endDate.toISOString().slice(0, 10));

    // Pagination
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order('booking_date', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Failed to fetch transactions: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);

    let transactions = (data || []).map((b: any) => ({
      id: b.id,
      date: b.booking_date,
      studentName: b.student?.user?.name || 'Unknown',
      studentAvatar: b.student?.user?.avatar_url,
      courseTitle: b.course?.title || 'Unknown',
      courseType: b.course?.course_type || 'General',
      amount: this.resolveAmount(b),
      studentId: b.student_id,
      courseId: b.course_id,
      statusKey: Array.isArray(b.booking_statuses) ? b.booking_statuses[0]?.status_key : b.booking_statuses?.status_key,
    }));

    // Client-side filtering for search query (course title or student name)
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.courseTitle.toLowerCase().includes(q) ||
          t.studentName.toLowerCase().includes(q)
      );
    }

    // Client-side filtering for course type
    if (filter.courseType && filter.courseType.trim()) {
      transactions = transactions.filter(
        (t) => t.courseType === filter.courseType
      );
    }

    return { data: transactions, total: count || 0 };
  }
}
