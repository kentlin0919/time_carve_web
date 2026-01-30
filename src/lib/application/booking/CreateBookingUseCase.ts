import { Booking } from "@/lib/domain/booking/entity";
import { BookingRepository } from "@/lib/domain/booking/repository";
import { AvailabilityRepository } from "@/lib/domain/teacher/AvailabilityRepository";
import { NotificationRepository } from "@/lib/domain/notification/repository";

export class CreateBookingUseCase {
  constructor(
    private bookingRepository: BookingRepository,
    private availabilityRepository: AvailabilityRepository,
    private notificationRepository?: NotificationRepository
  ) { }

  async execute(
    booking: Omit<Booking, "id" | "status" | "studentName" | "studentEmail" | "courseTitle">
  ): Promise<Booking> {
    // 0. Check for Unpaid Bookings
    const unpaidCount = await this.bookingRepository.getUnpaidBookingsCount(booking.studentId);
    if (unpaidCount > 0) {
      throw new Error("您有尚未付款的課程，請先完成付款後再預約新課程。");
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
