'use server'

import { createClient } from "@/lib/supabase/server";

export type PaymentRecord = {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  student_name: string;
  student_email: string;
  student_avatar_url: string | null;
  course_title: string;
  is_overdue: boolean;
};

export type PaymentSummary = {
  total_projected: number;
  total_received: number;
  pending_count: number;
  overdue_count: number;
  overdue_amount: number;
};

export async function getTeacherPayments(
  year: number,
  month: number,
  searchQuery?: string
): Promise<{ records: PaymentRecord[]; summary: PaymentSummary }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // Calculate start and end date for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

  const startStr = startDate.toISOString().split("T")[0]; // YYYY-MM-DD
  const endStr = endDate.toISOString().split("T")[0];

  const query = supabase
    .from("bookings")
    .select(`
      id,
      booking_date,
      start_time,
      end_time,
      price,
      paid_at,
      booking_statuses(status_key),
      course:courses(title, price),
      student:student_info(
        user:user_info(name, email, avatar_url)
      )
    `)
    .eq("teacher_id", user.id)
    .gte("booking_date", startStr)
    .lte("booking_date", endStr);

  const { data: bookings, error } = await query;

  if (error) {
    console.error("Error fetching payments detailed:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to fetch payments: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
  }

  const now = new Date();
  
  const records: PaymentRecord[] = [];
  const summary: PaymentSummary = {
    total_projected: 0,
    total_received: 0,
    pending_count: 0,
    overdue_count: 0,
    overdue_amount: 0,
  };

  for (const booking of bookings || []) {
    const course = booking.course as { title: string; price: number } | null;
    const studentUser = booking.student?.user as { name: string; email: string; avatar_url: string | null } | null;
    const statusKey = booking.booking_statuses?.status_key as string || 'pending';

    if (statusKey === "cancelled" || statusKey === "rejected") {
      continue;
    }
    
    // Filter by search query if present
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = studentUser?.name.toLowerCase().includes(q);
      const matchCourse = course?.title.toLowerCase().includes(q);
      if (!matchName && !matchCourse) continue;
    }

    const unitPrice = course?.price || 0;
    
    let hours = 0;
    let finalStartTimeStr = booking.start_time || '';
    let finalEndTimeStr = booking.end_time || '';
    let finalBookingDate = booking.booking_date || '';
    if (finalBookingDate.includes('T')) {
      finalBookingDate = finalBookingDate.split('T')[0];
    }
    
    let bookingEndDate: Date;

    if (finalStartTimeStr.includes('T') || finalEndTimeStr.includes('T')) {
      const dStart = new Date(finalStartTimeStr);
      const dEnd = new Date(finalEndTimeStr);
      hours = (dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60);
      
      finalStartTimeStr = dStart.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' });
      finalEndTimeStr = dEnd.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' });
      bookingEndDate = dEnd;
    } else {
      finalStartTimeStr = finalStartTimeStr.slice(0, 5);
      finalEndTimeStr = finalEndTimeStr.slice(0, 5);
      
      const [startH, startM] = finalStartTimeStr.split(':').map(Number);
      const [endH, endM] = finalEndTimeStr.split(':').map(Number);
      const startMinutes = (startH || 0) * 60 + (startM || 0);
      let endMinutes = (endH || 0) * 60 + (endM || 0);
      if (endMinutes < startMinutes) endMinutes += 24 * 60; // cross-day
      hours = (endMinutes - startMinutes) / 60;
      
      bookingEndDate = new Date(`${finalBookingDate}T${finalEndTimeStr}`);
    }
    
    if (isNaN(hours) || hours < 0) hours = 0;
    
    const persistedPrice =
      typeof booking.price === "number"
        ? booking.price
        : booking.price != null
          ? Number(booking.price)
          : null;

    // Prefer persisted booking price; fallback to course price * hours for older data.
    const price = persistedPrice ?? unitPrice * hours;

    // Map status_key to our frontend status (assuming they match roughly or we map them)
    // Common keys: 'pending', 'confirmed', 'completed', 'cancelled'
    const status = statusKey;

    const isPaid =
      Boolean(booking.paid_at) ||
      status === 'completed' ||
      status === 'confirmed' ||
      status === 'paid';
    const isPending = status === 'pending';
    
    const isOverdue = isPending && bookingEndDate < now;

    records.push({
      id: booking.id,
      booking_date: finalBookingDate,
      start_time: finalStartTimeStr,
      end_time: finalEndTimeStr,
      status: status,
      price,
      student_name: studentUser?.name || "Unknown",
      student_email: studentUser?.email || "",
      student_avatar_url: studentUser?.avatar_url || null,
      course_title: course?.title || "Unknown Course",
      is_overdue: isOverdue,
    });

    // Update Summary
    summary.total_projected += price;
    if (isPaid) {
      summary.total_received += price;
    }
    if (isPending) {
        summary.pending_count += 1;
    }
    if (isOverdue) {
        summary.overdue_count += 1;
        summary.overdue_amount += price;
    }
  }

  // Sort by date desc
  records.sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());

  return { records, summary };
}
