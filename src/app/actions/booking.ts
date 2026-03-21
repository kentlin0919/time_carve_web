'use server'

import { GetAvailableSlotsUseCase } from "@/lib/application/booking/GetAvailableSlotsUseCase";
import { CreateBookingUseCase } from "@/lib/application/booking/CreateBookingUseCase";
import { SupabaseAvailabilityRepository } from "@/lib/infrastructure/teacher/SupabaseAvailabilityRepository";
import { SupabaseNotificationRepository } from "@/lib/infrastructure/notification/SupabaseNotificationRepository";
import { SupabaseBookingRepository } from "@/lib/infrastructure/booking/SupabaseBookingRepository";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function getAvailableSlots(
  teacherId: string,
  startDate: string, // Changed to string YYYY-MM-DD
  endDate: string,   // Changed to string YYYY-MM-DD
  durationMinutes: number
) {
  const supabase = await createClient();
  const availRepo = new SupabaseAvailabilityRepository(supabase);
  const bookingRepo = new SupabaseBookingRepository(supabase);
  const useCase = new GetAvailableSlotsUseCase(availRepo, bookingRepo);

  // Parse strings to Date objects (UTC midnight)
  const start = new Date(startDate);
  const end = new Date(endDate);

  return await useCase.execute(teacherId, start, end, durationMinutes);
}

export async function checkBookingConflict(
  teacherId: string,
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      start_time,
      end_time,
      booking_status:booking_statuses!fk_booking_status!inner (
        status_key
      )
    `)
    .eq("teacher_id", teacherId)
    .eq("booking_date", bookingDate)
    .neq("booking_status.status_key", "cancelled")
    .neq("booking_status.status_key", "rejected");

  if (error) {
    throw new Error(`檢查時段衝突失敗：${error.message}`);
  }

  const toMinutes = (time: string) => {
    const match = time.match(/(\d{2}):(\d{2})/);
    if (!match) return 0;
    return Number(match[1]) * 60 + Number(match[2]);
  };

  const requestedStart = toMinutes(startTime);
  const requestedEnd = toMinutes(endTime);

  const hasConflict = (data || []).some((booking: any) => {
    const existingStart = toMinutes(String(booking.start_time));
    const existingEnd = toMinutes(String(booking.end_time));
    return requestedStart < existingEnd && requestedEnd > existingStart;
  });

  return { hasConflict };
}

export async function getStudentBookings() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const bookingRepo = new SupabaseBookingRepository(supabase);
  return await bookingRepo.getStudentBookings(user.id);
}

export async function getStudentSlotRequests() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const repo = new SupabaseSlotRequestRepository(supabase);
  return await repo.getSlotRequestsByStudentId(user.id);
}

export async function approveSlotRequest(
  slotRequestId: string,
  selection:
    | { rank: 1 | 2 | 3 }
    | { bookingDate: string; startTime: string; endTime: string }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const slotRequestRepo = new SupabaseSlotRequestRepository(supabase);
    const request = await slotRequestRepo.getSlotRequestById(slotRequestId);

    if (!request) {
      throw new Error("找不到時段申請");
    }

    if (request.teacherId !== user.id) {
      throw new Error("Unauthorized");
    }

    let bookingDate = "";
    let startTime = "";
    let endTime = "";
    let selectedRank: 1 | 2 | 3 | undefined;

    if ("rank" in selection) {
      selectedRank = selection.rank;
      if (selection.rank === 1) {
        bookingDate = request.preference1Date;
        startTime = request.preference1Start;
        endTime = request.preference1End;
      } else if (selection.rank === 2) {
        bookingDate = request.preference2Date;
        startTime = request.preference2Start;
        endTime = request.preference2End;
      } else {
        bookingDate = request.preference3Date;
        startTime = request.preference3Start;
        endTime = request.preference3End;
      }
    } else {
      bookingDate = selection.bookingDate;
      startTime = selection.startTime;
      endTime = selection.endTime;
    }

    const result = await createBooking(
      {
        teacherId: request.teacherId,
        studentId: request.studentId,
        courseId: request.courseId,
        bookingDate,
        startTime,
        endTime,
        notes: request.notes || null,
      },
      { buyNewPack: false, skipAvailabilityValidation: true }
    );

    if (!result.success || !result.data) {
      throw new Error(result.error || "建立正式預約失敗");
    }

    await slotRequestRepo.updateSlotRequestStatus(slotRequestId, {
      status: "approved",
      selectedRank,
      bookingId: result.data.id,
    });

    const adminSupabase = createAdminClient();
    const notificationRepo = new SupabaseNotificationRepository(adminSupabase);
    await notificationRepo.createNotification(
      request.studentId,
      "BOOKING",
      "時段申請已核准",
      "老師已確認您的時段申請，正式預約已建立。",
      { bookingId: result.data.id, slotRequestId }
    );

    return { success: true, bookingId: result.data.id };
  } catch (error: any) {
    console.error("[approveSlotRequest] failed:", error);
    return {
      success: false,
      error: error?.message || "核准時段申請失敗",
    };
  }
}

export async function rejectSlotRequest(
  slotRequestId: string,
  rejectReason?: string
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const slotRequestRepo = new SupabaseSlotRequestRepository(supabase);
    const request = await slotRequestRepo.getSlotRequestById(slotRequestId);

    if (!request) {
      throw new Error("找不到時段申請");
    }

    if (request.teacherId !== user.id) {
      throw new Error("Unauthorized");
    }

    await slotRequestRepo.updateSlotRequestStatus(slotRequestId, {
      status: "rejected",
      rejectReason: rejectReason?.trim() || "老師目前無法配合這些時段",
    });

    const adminSupabase = createAdminClient();
    const notificationRepo = new SupabaseNotificationRepository(adminSupabase);
    await notificationRepo.createNotification(
      request.studentId,
      "BOOKING",
      "時段申請未通過",
      rejectReason?.trim() || "老師目前無法配合這些時段，請重新提出新的申請。",
      { slotRequestId }
    );

    return { success: true };
  } catch (error: any) {
    console.error("[rejectSlotRequest] failed:", error);
    return {
      success: false,
      error: error?.message || "拒絕時段申請失敗",
    };
  }
}

export async function getTeacherBookings(
  startDate: Date,
  endDate: Date
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const bookingRepo = new SupabaseBookingRepository(supabase);

  // Format dates to YYYY-MM-DD string as expected by repository
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];


  return await bookingRepo.getBookings(user.id, startStr, endStr);
}

import { SupabasePurchaseRepository } from "@/lib/infrastructure/purchase/SupabasePurchaseRepository";
import { SupabaseCourseRepository } from "@/lib/infrastructure/course/SupabaseCourseRepository";
import { SupabaseProgressRepository } from "@/lib/infrastructure/progress/SupabaseProgressRepository";
import { SupabaseSlotRequestRepository } from "@/lib/infrastructure/slot-request/SupabaseSlotRequestRepository";

export async function createBooking(
  bookingData: {
    teacherId: string;
    studentId: string;
    courseId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    notes?: string | null;
    purchaseId?: string | null;
    requestedSlots?: { date: string; startTime: string; endTime: string }[];
  },
  options: { buyNewPack?: boolean; skipAvailabilityValidation?: boolean } = {}
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify user is either the student OR the teacher
    if (user.id !== bookingData.studentId && user.id !== bookingData.teacherId) {
      throw new Error("Unauthorized booking attempt");
    }

    const bookingRepo = new SupabaseBookingRepository(supabase);
    const availRepo = new SupabaseAvailabilityRepository(supabase);
    const purchaseRepo = new SupabasePurchaseRepository(supabase);
    const courseRepo = new SupabaseCourseRepository(supabase);
    const progressRepo = new SupabaseProgressRepository(supabase);
    const slotRequestRepo = new SupabaseSlotRequestRepository(supabase);

    // Use Admin Client for notifications to bypass RLS (Student notifying Teacher)
    const adminSupabase = createAdminClient();
    const notificationRepo = new SupabaseNotificationRepository(adminSupabase);

    const useCase = new CreateBookingUseCase(
      bookingRepo,
      availRepo,
      notificationRepo,
      purchaseRepo,
      courseRepo,
      progressRepo,
      slotRequestRepo
    );

    const result = await useCase.execute(bookingData, options);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("createBooking error:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

export async function updateBookingStatus(bookingId: string, status: "pending" | "confirmed" | "cancelled" | "completed") {
  const supabase = await createClient();

  // 1. Get status ID
  const { data: statusData, error: statusError } = await supabase
    .from("booking_statuses")
    .select("id")
    .eq("status_key", status)
    .single();

  if (statusError || !statusData) {
    throw new Error(`Invalid status: ${status}`);
  }

  // 2. Update booking with status_id
  const { error } = await supabase
    .from("bookings")
    // @ts-ignore
    .update({ status_id: statusData.id })
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function updateBookingFeedback(
  bookingId: string,
  data: {
    homework?: string | null;
    teacherFeedback?: string | null;
    teacherFeedbackVisible?: boolean;
  }
) {
  const supabase = await createClient();

  const updateData: any = {
    feedback_updated_at: new Date().toISOString(),
  };

  if ("homework" in data) updateData.homework = data.homework;
  if ("teacherFeedback" in data) updateData.teacher_feedback = data.teacherFeedback;
  if ("teacherFeedbackVisible" in data)
    updateData.teacher_feedback_visible = data.teacherFeedbackVisible;

  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}


export async function getTeacherPendingBookingCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const repo = new SupabaseBookingRepository(supabase);
  return await repo.getPendingBookingsCount(user.id);
}

export async function getTeacherPendingBookings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const repo = new SupabaseBookingRepository(supabase);
  return await repo.getPendingBookings(user.id);
}

export async function getTeacherSlotRequests() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const repo = new SupabaseSlotRequestRepository(supabase);
  return await repo.getSlotRequestsByTeacherId(user.id);
}

export async function getBookingById(bookingId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const bookingRepo = new SupabaseBookingRepository(supabase);
  const booking = await bookingRepo.getBookingById(bookingId);

  // Security check: only student or teacher of the booking can view/reschedule
  // Ideally repo or RLS handles this, but explicit check is safer if repo just fetches by ID.
  // getBookingById typically joins tables.
  if (!booking) return null;

  if (booking.studentId !== user.id && booking.teacherId !== user.id) {
    throw new Error("Unauthorized access to booking");
  }

  return booking;
}

export async function checkUnpaidBookings(studentId: string): Promise<{ hasUnpaid: boolean; count: number }> {
  const supabase = await createClient();
  const repo = new SupabaseBookingRepository(supabase);
  // Temporary stub for the linter. Real implementation will be in Phase 3.
  return { hasUnpaid: false, count: 0 };
}
