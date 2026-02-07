'use server';

import { createClient } from "@/lib/supabase/server";
import { SupabaseReportRepository } from "@/lib/infrastructure/reports/SupabaseReportRepository";
import { TransactionFilter } from "@/lib/domain/reports/ReportRepository";

async function getRepository() {
  const supabase = await createClient();
  return new SupabaseReportRepository(supabase);
}

export async function getReportStats(startDateStr: string, endDateStr: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const repo = new SupabaseReportRepository(supabase);
  return repo.getStats(user.id, new Date(startDateStr), new Date(endDateStr));
}

export async function getRevenueTrends(range: '6_months' | 'year') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const repo = new SupabaseReportRepository(supabase);
  return repo.getRevenueTrends(user.id, range);
}

export async function getCourseRevenueDistribution() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const repo = new SupabaseReportRepository(supabase);
  return repo.getCourseRevenueDistribution(user.id);
}

export async function getTransactionList(filter: TransactionFilter) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const repo = new SupabaseReportRepository(supabase);
  return repo.getTransactions(user.id, filter);
}

export async function exportReportData(startDateStr: string, endDateStr: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const repo = new SupabaseReportRepository(supabase);

  // Fetch teacher info
  const { data: teacherInfo } = await supabase
    .from('teacher_info')
    .select('user:user_info(name)')
    .eq('user_id', user.id)
    .single();
  const teacherName = (teacherInfo?.user as { name?: string })?.name || '未知';

  // Fetch all data
  const [stats, distribution, transactions] = await Promise.all([
    repo.getStats(user.id, new Date(startDateStr), new Date(endDateStr)),
    repo.getCourseRevenueDistribution(user.id),
    repo.getTransactions(user.id, { startDate: new Date(startDateStr), endDate: new Date(endDateStr), pageSize: 1000 }),
  ]);

  // Format helpers
  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;
  const formatGrowth = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
  const now = new Date();
  const exportTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Build CSV
  const lines: string[] = [];

  // Section 1: Header
  lines.push("TimeCarve 刻時 - 營收報表");
  lines.push(`教師名稱,${teacherName}`);
  lines.push(`報表期間,${startDateStr} ~ ${endDateStr}`);
  lines.push(`匯出時間,${exportTime}`);
  lines.push("");

  // Section 2: Summary Stats
  lines.push("=== 統計摘要 ===");
  lines.push("指標,數值,成長率");
  lines.push(`本月總營收,${formatCurrency(stats.totalRevenue)},${formatGrowth(stats.totalRevenueGrowth)}`);
  lines.push(`累計課程數,${stats.totalSessions} 堂,${formatGrowth(stats.totalSessionsGrowth)}`);
  lines.push(`平均每堂收入,${formatCurrency(stats.averageOrderValue)},${formatGrowth(stats.averageOrderValueGrowth)}`);
  lines.push(`活躍學生數,${stats.activeStudents} 人,${formatGrowth(stats.activeStudentsGrowth)}`);
  lines.push("");

  // Section 3: Course Distribution
  lines.push("=== 課程收入分佈 ===");
  lines.push("課程名稱,營收金額,佔比");
  const totalRevenue = distribution.reduce((sum, d) => sum + d.value, 0);
  distribution.forEach((d) => {
    const percentage = totalRevenue > 0 ? (d.value / totalRevenue * 100) : 0;
    lines.push(`${d.name},${formatCurrency(d.value)},${percentage.toFixed(1)}%`);
  });
  lines.push("");

  // Section 4: Transaction List
  lines.push("=== 交易明細 ===");
  lines.push("序號,日期,學生姓名,課程名稱,課程類型,金額,狀態");
  const statusMap: Record<string, string> = {
    'pending': '待確認',
    'confirmed': '已確認',
    'completed': '已完成',
    'cancelled': '已取消',
    'in_progress': '進行中',
  };
  transactions.data.forEach((t, idx) => {
    const statusText = statusMap[t.statusKey || ''] || t.statusKey || '未知';
    lines.push(`${idx + 1},${t.date},${t.studentName},${t.courseTitle},${t.courseType},${formatCurrency(t.amount)},${statusText}`);
  });

  return lines.join("\n");
}

export type ReportTransactionDetail = {
  booking: {
    id: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    statusKey: string | null;
    statusLabel: string | null;
    notes: string | null;
    price: number | string | null;
    paidAt: string | null;
  };
  student: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  course: {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    courseType: string;
    durationMinutes: number | null;
    price: number | string | null;
    location: string | null;
    sections: unknown[] | null;
    expectedLearningOutcomes: string[] | null;
  };
  progress: {
    id: string;
    status: string;
    progressPercentage: number | null;
    completedSectionIds: string[];
    currentSectionId: string | null;
    teacherNotes: string | null;
    updatedAt: string;
  } | null;
};

export async function getTransactionDetail(bookingId: string): Promise<ReportTransactionDetail> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_date,
      start_time,
      end_time,
      notes,
      price,
      paid_at,
      booking_status:booking_statuses!fk_booking_status(
        status_key,
        label_zh
      ),
      student:student_info(
        id,
        user:user_info(name, avatar_url)
      ),
      course:courses(
        id,
        title,
        description,
        content,
        course_type,
        duration_minutes,
        price,
        location,
        sections,
        expected_learning_outcomes
      )
    `)
    .eq("id", bookingId)
    .eq("teacher_id", user.id)
    .single();

  if (error || !booking) {
    throw new Error(`Failed to fetch transaction detail: ${error?.message || "not found"}`);
  }

  const studentId = booking.student?.id;
  const courseId = booking.course?.id;
  let progressRow: any = null;

  if (studentId && courseId) {
    const { data: progressData } = await supabase
      .from("student_course_progress")
      .select("*")
      .eq("student_id", studentId)
      .eq("course_id", courseId)
      .limit(1);

    progressRow = progressData?.[0] || null;
  }

  return {
    booking: {
      id: booking.id,
      bookingDate: booking.booking_date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      statusKey: booking.booking_status?.status_key || null,
      statusLabel: booking.booking_status?.label_zh || null,
      notes: booking.notes,
      price: booking.price,
      paidAt: booking.paid_at,
    },
    student: {
      id: booking.student?.id,
      name: booking.student?.user?.name || "Unknown",
      avatarUrl: booking.student?.user?.avatar_url || null,
    },
    course: {
      id: booking.course?.id,
      title: booking.course?.title || "Unknown",
      description: booking.course?.description || null,
      content: booking.course?.content || null,
      courseType: booking.course?.course_type || "General",
      durationMinutes: booking.course?.duration_minutes || null,
      price: booking.course?.price ?? null,
      location: booking.course?.location || null,
      sections: Array.isArray(booking.course?.sections) ? booking.course.sections as unknown[] : null,
      expectedLearningOutcomes: Array.isArray(booking.course?.expected_learning_outcomes) ? booking.course.expected_learning_outcomes as string[] : null,
    },
    progress: progressRow
      ? {
        id: progressRow.id,
        status: progressRow.status,
        progressPercentage: progressRow.progress_percentage,
        completedSectionIds: Array.isArray(progressRow.completed_section_ids)
          ? progressRow.completed_section_ids
          : [],
        currentSectionId: progressRow.current_section_id,
        teacherNotes: progressRow.teacher_notes,
        updatedAt: progressRow.updated_at,
      }
      : null,
  };
}
