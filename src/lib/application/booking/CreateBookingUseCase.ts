import { Booking } from "@/lib/domain/booking/entity";
import { BookingRepository } from "@/lib/domain/booking/repository";
import { AvailabilityRepository } from "@/lib/domain/teacher/AvailabilityRepository";
import { NotificationRepository } from "@/lib/domain/notification/repository";

import { PurchaseRepository } from "@/lib/domain/purchase/entity";

export class CreateBookingUseCase {
  constructor(
    private bookingRepository: BookingRepository,
    private availabilityRepository: AvailabilityRepository,
    private notificationRepository?: NotificationRepository,
    private purchaseRepository?: PurchaseRepository
  ) { }

  async execute(
    booking: Omit<Booking, "id" | "status" | "studentName" | "studentEmail" | "courseTitle">
  ): Promise<Booking> {
    // 0. Check for Unpaid Bookings (Only block if not using a valid purchase)
    if (!booking.purchaseId) {
      const unpaidCount = await this.bookingRepository.getUnpaidBookingsCount(booking.studentId);
      if (unpaidCount > 0) {
        throw new Error("您有尚未付款的課程，請先完成付款後再預約新課程。");
      }
    }

    // 0.5. Validate & Deduct Purchase (if applicable)
    if (booking.purchaseId && this.purchaseRepository) {
      const purchase = await this.purchaseRepository.getPurchaseById(booking.purchaseId);
      if (!purchase) throw new Error("無效的課程包代碼");
      if (purchase.status !== 'active') throw new Error("此課程包已過期或失效");
      if (purchase.studentId !== booking.studentId) throw new Error("無法使用他人的課程包");

      // Calculate Duration
      const startParts = booking.startTime.split(':').map(Number);
      const endParts = booking.endTime.split(':').map(Number);
      const startMins = startParts[0] * 60 + startParts[1];
      const endMins = endParts[0] * 60 + endParts[1];
      const durationHours = (endMins - startMins) / 60;

      if (purchase.remainingHours < durationHours) {
        throw new Error(`課程包剩餘時數不足 (剩餘: ${purchase.remainingHours}小時, 需: ${durationHours}小時)`);
      }

      // Deduct Logic
      const newRemaining = purchase.remainingHours - durationHours;
      await this.purchaseRepository.updateRemainingHours(purchase.id, newRemaining);

      if (newRemaining <= 0) {
        await this.purchaseRepository.updateStatus(purchase.id, 'completed');
      }

      // Mark as Paid via Package
      booking.price = 0;
      booking.paidAt = new Date().toISOString();
    }

    // 1. Validate Availability
    await this.validateAvailability(booking);

    // 2. Create Booking
    const newBooking = await this.bookingRepository.createBooking(booking);

    if (this.notificationRepository) {
      // Notify Teacher
      await this.notificationRepository.createNotification(
        booking.teacherId,
        'BOOKING',
        '新課程預約通知',
        `您收到了一個新的預約請求。日期：${booking.bookingDate}，時間：${booking.startTime} - ${booking.endTime}`,
        { bookingId: newBooking.id, studentId: booking.studentId }
      );
    }

    return newBooking;
  }

  private async validateAvailability(booking: Omit<Booking, "id" | "status" | "studentName" | "studentEmail" | "courseTitle">) {
    const { teacherId, bookingDate, startTime, endTime } = booking;

    // Fetch availability for this specific day
    const [weekly, overrides] = await Promise.all([
      this.availabilityRepository.getWeeklyAvailability(teacherId),
      this.availabilityRepository.getOverrides(teacherId, bookingDate, bookingDate)
    ]);

    // Check Overrides first
    const dayOverride = overrides.find((o: any) => o.date === bookingDate);

    let allowedRanges: { start: string, end: string }[] = [];

    if (dayOverride) {
      if (dayOverride.isUnavailable) {
        throw new Error("Selected date is marked as unavailable by the teacher.");
      }
      if (dayOverride.startTime && dayOverride.endTime) {
        allowedRanges.push({ start: dayOverride.startTime, end: dayOverride.endTime });
      }
    } else {
      // Fallback to weekly schedule
      const dateObj = new Date(bookingDate);
      const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon...

      const weeklyRules = weekly.filter((w: any) => w.dayOfWeek === dayOfWeek);
      weeklyRules.forEach((w: any) => {
        allowedRanges.push({ start: w.startTime, end: w.endTime });
      });
    }

    if (allowedRanges.length === 0) {
      throw new Error("Teacher is not available on this day.");
    }

    // Convert time to minutes for comparison
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const bookingStart = toMinutes(startTime);
    const bookingEnd = toMinutes(endTime);

    // Check if booking fits completely within ANY of the allowed ranges
    const isWithinRange = allowedRanges.some(range => {
      const rangeStart = toMinutes(range.start);
      const rangeEnd = toMinutes(range.end);
      return bookingStart >= rangeStart && bookingEnd <= rangeEnd;
    });

    if (!isWithinRange) {
      throw new Error("Selected time is not within the teacher's available hours.");
    }
  }
}
