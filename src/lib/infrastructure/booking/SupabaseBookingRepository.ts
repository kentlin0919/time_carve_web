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
        ),
        reschedule_requests:booking_reschedule_requests (
           id, requested_by, new_start_time, status, reason, created_at
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
      rescheduleRequests: item.reschedule_requests?.map((r: any) => ({
        id: r.id,
        bookingId: item.id,
        requestedBy: r.requested_by,
        newStartTime: r.new_start_time,
        status: r.status,
        reason: r.reason,
        createdAt: r.created_at
      })) || [],
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

    const startTimestamp = `${booking.bookingDate} ${booking.startTime}:00`;
    const endTimestamp = `${booking.bookingDate} ${booking.endTime}:00`;

    const { data, error } = await this.client
      .from("bookings")
      // @ts-ignore
      .insert({
        teacher_id: booking.teacherId,
        student_id: booking.studentId,
        course_id: booking.courseId,
        booking_date: booking.bookingDate,
        start_time: startTimestamp,
        end_time: endTimestamp,
        status_id: statusData.id,
        notes: booking.notes,
        purchase_id: booking.purchaseId,
        price: booking.price,
        paid_at: booking.paidAt
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
      throw new Error(`Failed to create booking: ${error.message} (${error.code})`);
    }

    return this.mapRowToBooking(data);
  }

  private mapRowToBooking(data: any): Booking {
    // Helper to extract HH:mm from timestamp or time string
    const formatTime = (timeVal: string) => {
      // If it's a full timestamp (contains T or space and date parts)
      if (timeVal && (timeVal.includes("T") || timeVal.includes("-"))) {
        const date = new Date(timeVal);
        const hours = date.getUTCHours().toString().padStart(2, "0");
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      }
      // If it's already HH:mm or HH:mm:ss
      if (timeVal && timeVal.includes(":")) {
        return timeVal.substring(0, 5);
      }
      return timeVal;
    };

    return {
      id: data.id,
      teacherId: data.teacher_id,
      studentId: data.student_id,
      courseId: data.course_id,
      bookingDate: data.booking_date,
      startTime: formatTime(data.start_time),
      endTime: formatTime(data.end_time),
      status: data.booking_status?.status_key || "pending",
      notes: data.notes,
      price: data.price,
      purchaseId: data.purchase_id,
      courseTitle: data.course?.title || "",
      studentName: data.student?.user?.name || "",
      teacherName: data.teacher?.user?.name || "",
      courseType: data.course?.course_type || ""
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
        ),
        reschedule_requests:booking_reschedule_requests (
           id, requested_by, new_start_time, status, reason, created_at
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

    return data.map((item: any) => this.mapRowToBooking(item));
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

  async getPendingBookingsCount(teacherId: string): Promise<number> {
    // 1. Get status ID for 'pending'
    const { data: statusData, error: statusError } = await this.client
      .from("booking_statuses")
      .select("id")
      .eq("status_key", "pending")
      .single();

    if (statusError || !statusData) {
      console.error("Could not find 'pending' booking status for count");
      return 0;
    }

    // 2. Count bookings with this status for the teacher
    const { count, error } = await this.client
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", teacherId)
      .eq("status_id", statusData.id);

    if (error) {
      console.error("Error fetching pending booking count:", error);
      return 0;
    }

    return count || 0;
  }

  async getPendingBookings(teacherId: string): Promise<Booking[]> {
    // 1. Get status ID for 'pending'
    const { data: statusData, error: statusError } = await this.client
      .from("booking_statuses")
      .select("id")
      .eq("status_key", "pending")
      .single();

    if (statusError || !statusData) {
      console.error("Could not find 'pending' booking status for list");
      return [];
    }

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
        ),
        reschedule_requests:booking_reschedule_requests (
           id, requested_by, new_start_time, status, reason, created_at
        )
      `)
      .eq("teacher_id", teacherId)
      .eq("status_id", statusData.id)
      .order("booking_date", { ascending: true });

    if (error) {
      console.error("Error fetching pending bookings:", error);
      return [];
    }

    return data.map((item: any) => this.mapRowToBooking(item));
  }

  async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await this.client
      .from("bookings")
      .select(`
        *,
        booking_status:booking_statuses (
          status_key
        ),
        student:student_info (
          user:user_info (name, email)
        ),
        teacher:teacher_info (
          title
        ),
        course:courses (
          title, course_type, price, description, sections, location
        ),
        reschedule_requests:booking_reschedule_requests (
           id, requested_by, new_start_time, status, reason, created_at
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) return null;

    const booking = this.mapRowToBooking(data);

    // Enrich with extra details for the detail page
    booking.courseDescription = data.course?.description || "";
    booking.courseSections = data.course?.sections as any[] || [];
    booking.teacherTitle = data.teacher?.title || "";
    booking.location = data.course?.location || "";
    booking.teacherNotes = data.notes || ""; // Booking notes often used as teacher notes

    // Mocking payment status/method for now as per entity definition
    // In real scenario, would join with payment tables
    booking.paymentStatus = data.paid_at ? "paid" : "pending";
    booking.paymentMethod = data.paid_at ? "線上付款" : "尚未付款";

    return booking;
  }

  async updateBooking(id: string, booking: Partial<Booking>): Promise<void> {
    const updateData: any = { updated_at: new Date().toISOString() };

    // If Date or Time changes, we must sync booking_date, start_time, and end_time
    if (booking.bookingDate || booking.startTime || booking.endTime) {
      const existing = await this.getBookingById(id);
      if (!existing) {
        throw new Error(`Booking ${id} not found for update`);
      }

      const newDate = booking.bookingDate || existing.bookingDate;
      const newStart = booking.startTime || existing.startTime;
      const newEnd = booking.endTime || existing.endTime;

      updateData.booking_date = newDate;

      const toTimestamp = (date: string, time: string) => {
        if (time.includes("T") || time.includes(" ")) return time; // Already timestamp
        return `${date} ${time}:00`;
      };

      updateData.start_time = toTimestamp(newDate, newStart);
      updateData.end_time = toTimestamp(newDate, newEnd);
    }

    if (booking.status) {
      const { data: statusData, error } = await this.client
        .from("booking_statuses")
        .select("id")
        .eq("status_key", booking.status)
        .single();
      if (statusData) updateData.status_id = statusData.id;
    }
    if (booking.notes) updateData.notes = booking.notes;

    const { error } = await this.client
      .from("bookings")
      .update(updateData)
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }
  }
}
