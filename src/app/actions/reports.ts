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
    sections: any[] | null;
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
      sections: booking.course?.sections || null,
      expectedLearningOutcomes: booking.course?.expected_learning_outcomes || null,
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
