import { Booking } from "@/lib/domain/booking/entity";
import { BookingRepository } from "@/lib/domain/booking/repository";
import { supabase as defaultClient } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseBookingRepository implements BookingRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || defaultClient;
  }

  async getBookings(teacherId: string, startDate: string, endDate: string): Promise<Booking[]> {
    const { data, error } = await this.client
      .from("bookings")
      .select(`
        *,
        booking_status:booking_statuses!fk_booking_status (
          status_key
        ),
        student:student_info (
          user:user_info (
            name,
            email
          )
        ),
        course:courses (
          title,
          course_type,
          price
        )
      `)
      .eq("teacher_id", teacherId)
      .neq("booking_status.status_key", "cancelled")
      .neq("booking_status.status_key", "rejected")
      .gte("booking_date", startDate)
      .lte("booking_date", endDate);

    if (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      teacherId: item.teacher_id,
      studentId: item.student_id,
      courseId: item.course_id,
      bookingDate: item.booking_date,
      startTime: item.start_time,
      endTime: item.end_time,
      status: item.booking_status?.status_key || "pending", // Map nested status back to string
      studentName: item.student?.user?.name || "Unknown",
      studentEmail: item.student?.user?.email || "",
      courseTitle: item.course?.title || "",
      courseType: item.course?.course_type || "",
      coursePrice: item.course?.price || 0,
    }));

  }

  async createBooking(booking: Omit<Booking, "id" | "status" | "studentName" | "studentEmail" | "courseTitle">): Promise<Booking> {
    // 1. Get status ID for 'pending'
    const { data: statusData, error: statusError } = await this.client
      .from("booking_statuses")
      .select("id")
      .eq("status_key", "pending")
      .single();

    if (statusError || !statusData) {
      throw new Error("Could not find 'pending' booking status");
    }

    const { data, error } = await this.client
      .from("bookings")
      // @ts-ignore
      .insert({
        teacher_id: booking.teacherId,
        student_id: booking.studentId,
        course_id: booking.courseId,
        booking_date: booking.bookingDate,
        start_time: booking.startTime,
        end_time: booking.endTime,
        status_id: statusData.id,
        notes: booking.notes,
      })
      .select(`
        *,
        booking_status:booking_statuses (
          status_key
        )
      `)
      .single();

    if (error) {
      console.error("Error creating booking:", error);
      throw error;
    }

    return {
      id: data.id,
      teacherId: data.teacher_id,
      studentId: data.student_id,
      courseId: data.course_id,
      bookingDate: data.booking_date,
      startTime: data.start_time,
      endTime: data.end_time,
      status: data.booking_status?.status_key || "pending",
      notes: data.notes,
    };
  }

  async getAllBookings(startDate: string, endDate: string): Promise<Booking[]> {
    const { data, error } = await this.client
      .from("bookings")
      .select(`
        *,
        booking_status:booking_statuses!fk_booking_status (
          status_key
        ),
        student:student_info (
          user:user_info (
            name,
            email
          )
        ),
        teacher:teacher_info (
          user:user_info (
            name,
            email
          )
        ),
        course:courses (
          title,
          course_type,
          price
        )
      `)
      .neq("booking_status.status_key", "cancelled")
      .neq("booking_status.status_key", "rejected")
      .gte("booking_date", startDate)
      .lte("booking_date", endDate);

    if (error) {
      console.error("Error fetching all bookings detailed:", JSON.stringify(error, null, 2));
      throw new Error(`Failed to fetch all bookings: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    }

    return data.map((item: any) => ({
      id: item.id,
      teacherId: item.teacher_id,
      studentId: item.student_id,
      courseId: item.course_id,
      bookingDate: item.booking_date,
      startTime: item.start_time,
      endTime: item.end_time,
      status: item.booking_status?.status_key || "pending",
      studentName: item.student?.user?.name || "Unknown",
      studentEmail: item.student?.user?.email || "",
      teacherName: item.teacher?.user?.name || "Unknown", // Add teacher name
      courseTitle: item.course?.title || "",
      courseType: item.course?.course_type || "",
      coursePrice: item.course?.price || 0,
    }));
  }

  async getUnpaidBookingsCount(studentId: string): Promise<number> {
    // Get IDs for active statuses (pending, confirmed)
    const { data: activeStatuses } = await this.client
      .from("booking_statuses")
      .select("id")
      .in("status_key", ["pending", "confirmed"]);

    if (!activeStatuses || activeStatuses.length === 0) return 0;
    const activeIds = activeStatuses.map(s => s.id);

    const { count, error } = await this.client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .is("paid_at", null)
      .in("status_id", activeIds);

    if (error) {
      console.error("Error checking unpaid bookings:", error);
      return 0;
    }

    return count || 0;
  }
}
