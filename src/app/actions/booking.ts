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
  }
) {
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

  // Use Admin Client for notifications to bypass RLS (Student notifying Teacher)
  const adminSupabase = createAdminClient();
  const notificationRepo = new SupabaseNotificationRepository(adminSupabase);

  const useCase = new CreateBookingUseCase(bookingRepo, availRepo, notificationRepo, purchaseRepo);

  return await useCase.execute(bookingData);
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
