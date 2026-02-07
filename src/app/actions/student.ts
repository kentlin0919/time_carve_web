'use server'

import { GetTeacherStudentsUseCase } from "@/lib/application/teacher/GetTeacherStudentsUseCase";
import { SupabaseTeacherRepository } from "@/lib/infrastructure/teacher/SupabaseTeacherRepository";
import { SupabaseBookingRepository } from "@/lib/infrastructure/booking/SupabaseBookingRepository";
import { createClient } from "@/lib/supabase/server";

export async function getStudentDashboardStats() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // 1. Get Completed Bookings Count
  const { data: statusData } = await supabase.from("booking_statuses").select("id").eq("status_key", "completed").single();
  
  const { count: completedCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .eq("status_id", statusData?.id || 0);

  // 2. Get Recent Bookings
  const bookingRepo = new SupabaseBookingRepository(supabase);
  const bookings = await bookingRepo.getStudentBookings(user.id);
  const recentBookings = bookings.slice(0, 5);

  return {
    completedCount: completedCount || 0,
    recentBookings
  };
}

export async function getTeacherStudents() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const teacherRepo = new SupabaseTeacherRepository(supabase);
  const useCase = new GetTeacherStudentsUseCase(teacherRepo);

  return await useCase.execute(user.id);
}
