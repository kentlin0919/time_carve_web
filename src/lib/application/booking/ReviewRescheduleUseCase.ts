import { IRescheduleRepository } from "@/lib/domain/booking/RescheduleRepository";
import { BookingRepository } from "@/lib/domain/booking/repository";

export class ReviewRescheduleUseCase {
    constructor(
        private rescheduleRepo: IRescheduleRepository,
        private bookingRepo: BookingRepository
    ) { }

    async execute(requestId: string, decision: 'approved' | 'rejected'): Promise<void> {
        const request = await this.rescheduleRepo.findById(requestId);
        if (!request) {
            throw new Error("Reschedule request not found");
        }

        if (request.status !== 'pending') {
            throw new Error("Request is already processed");
        }

        await this.rescheduleRepo.updateStatus(requestId, decision);

        if (decision === 'approved') {
            // 1. Get original booking to detect duration
            const booking = await this.bookingRepo.getBookingById(request.bookingId);
            if (!booking) {
                throw new Error("Original booking not found");
            }

            // 2. Calculate duration
            // Parse times "HH:mm:ss"
            const [startH, startM, startS] = booking.startTime.split(':').map(Number);
            const [endH, endM, endS] = booking.endTime.split(':').map(Number);

            const startDate = new Date();
            startDate.setHours(startH, startM, startS, 0);

            const endDate = new Date();
            endDate.setHours(endH, endM, endS, 0); // Handle overnight? Assuming same day for now or standard duration.
            // If end < start, maybe next day. But let's stick to simple diff.

            const durationMs = endDate.getTime() - startDate.getTime();

            // 3. New Start Time is an ISO string or similar "2023-01-01T10:00:00" from request
            // Let's assume request.newStartTime is full ISO 8601 string.
            const newStart = new Date(request.newStartTime);
            const newEnd = new Date(newStart.getTime() + durationMs);

            // 4. Format for DB
            const newBookingDate = newStart.toISOString().split('T')[0]; // YYYY-MM-DD
            const newStartTimeStr = newStart.toTimeString().split(' ')[0]; // HH:mm:ss
            const newEndTimeStr = newEnd.toTimeString().split(' ')[0]; // HH:mm:ss

            await this.bookingRepo.updateBooking(request.bookingId, {
                bookingDate: newBookingDate,
                startTime: newStartTimeStr,
                endTime: newEndTimeStr,
                // Optional: clear reminder_sent flag if we want fresh reminders
                // But that's not in Booking entity yet.
            });
        }
    }
}
