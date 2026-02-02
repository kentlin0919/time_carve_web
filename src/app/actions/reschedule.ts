'use server'

import { createClient } from "@/lib/supabase/server";
import { SupabaseRescheduleRepository } from "@/lib/infrastructure/booking/SupabaseRescheduleRepository";
import { SupabaseBookingRepository } from "@/lib/infrastructure/booking/SupabaseBookingRepository";
import { RequestRescheduleUseCase } from "@/lib/application/booking/RequestRescheduleUseCase";
import { ReviewRescheduleUseCase } from "@/lib/application/booking/ReviewRescheduleUseCase";
import { revalidatePath } from "next/cache";

export async function requestReschedule(
    bookingId: string,
    newStartTime: string, // ISO String or "YYYY-MM-DDTHH:mm"
    reason?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get original booking start time?
    // Use use case logic. Use Case needs original start time.
    // We can fetch it or pass it. 
    // Let's fetch it inside the action or use case.
    // Ideally Use Case should fetch it if not provided.
    // But my Use Case design took originalStartTime as input.
    // Let's fetch booking here to get original start time.

    const bookingRepo = new SupabaseBookingRepository(supabase);
    const booking = await bookingRepo.getBookingById(bookingId);
    if (!booking) {
        throw new Error("Booking not found");
    }

    // Construct full ISO for original time? Or just pass what we have?
    // RequestRescheduleUseCase expects string.
    // Let's create ISO from bookingDate + startTime
    const originalStartISO = `${booking.bookingDate}T${booking.startTime}`;

    const rescheduleRepo = new SupabaseRescheduleRepository(supabase);
    const useCase = new RequestRescheduleUseCase(rescheduleRepo);

    await useCase.execute({
        bookingId,
        requestedBy: user.id,
        originalStartTime: originalStartISO,
        newStartTime, // Assuming this is full ISO
        reason
    });

    revalidatePath('/student/bookings');
    revalidatePath('/teacher/bookings');
    revalidatePath(`/bookings/${bookingId}`);
}

export async function reviewReschedule(
    requestId: string,
    decision: 'approved' | 'rejected'
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const rescheduleRepo = new SupabaseRescheduleRepository(supabase);
    const bookingRepo = new SupabaseBookingRepository(supabase);
    const useCase = new ReviewRescheduleUseCase(rescheduleRepo, bookingRepo);

    await useCase.execute(requestId, decision);

    revalidatePath('/student/bookings');
    revalidatePath('/teacher/bookings');
    // Revalidate specific booking page if exists
}
