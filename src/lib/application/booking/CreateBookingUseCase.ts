import { Booking } from "@/lib/domain/booking/entity";
import { BookingRepository } from "@/lib/domain/booking/repository";
import { AvailabilityRepository } from "@/lib/domain/teacher/AvailabilityRepository";
import { NotificationRepository } from "@/lib/domain/notification/repository";
import { CourseRepository } from "@/lib/domain/course/repository";
import { ProgressRepository } from "@/lib/domain/progress/types";
import { PurchaseRepository } from "@/lib/domain/purchase/entity";
import { SlotRequestRepository } from "@/lib/domain/slot-request/repository";

export class CreateBookingUseCase {
  constructor(
    private bookingRepository: BookingRepository,
    private availabilityRepository: AvailabilityRepository,
    private notificationRepository?: NotificationRepository,
    private purchaseRepository?: PurchaseRepository,
    private courseRepository?: CourseRepository,
    private progressRepository?: ProgressRepository,
    private slotRequestRepository?: SlotRequestRepository
  ) { }

  async execute(
    booking: Omit<Booking, "id" | "status" | "studentName" | "studentEmail" | "courseTitle"> & {
      requestedSlots?: { date: string; startTime: string; endTime: string; }[];
    },
    options: { buyNewPack?: boolean; skipAvailabilityValidation?: boolean } = {}
  ): Promise<Booking> {
    
    // 0. 特殊處理：如果有 requestedSlots，代表這是一個 時段申請 (Slot Request)
    if (booking.requestedSlots && booking.requestedSlots.length === 3 && this.slotRequestRepository) {
      const slots = booking.requestedSlots;
      const request = await this.slotRequestRepository.createSlotRequest({
        studentId: booking.studentId,
        teacherId: booking.teacherId,
        courseId: booking.courseId,
        notes: booking.notes || undefined,
        preference1Date: slots[0].date,
        preference1Start: slots[0].startTime,
        preference1End: slots[0].endTime,
        preference2Date: slots[1].date,
        preference2Start: slots[1].startTime,
        preference2End: slots[1].endTime,
        preference3Date: slots[2].date,
        preference3Start: slots[2].startTime,
        preference3End: slots[2].endTime,
      });

      if (this.notificationRepository) {
        await this.notificationRepository.createNotification(
          booking.teacherId,
          'BOOKING',
          '新時段申請通知',
          `您收到了一個時段申請請求，請前往教師後台審核。`,
          { slotRequestId: request.id, studentId: booking.studentId }
        );
      }
      
      // Return a mock booking to satisfy the interface, the frontend will see success=true and ignore data.
      return { id: request.id, ...booking, status: 'pending' } as Booking;
    }

    // --- 以下為一般直接預約邏輯 ---
    // 0. Calculate Duration for the current booking
    const startParts = booking.startTime.split(':').map(Number);
    const endParts = booking.endTime.split(':').map(Number);
    const startMins = startParts[0] * 60 + startParts[1];
    const endMins = endParts[0] * 60 + endParts[1];
    const durationHours = Math.max(0, (endMins - startMins) / 60);

    // Calculate baseline price based on course price * duration
    if (booking.price === undefined && this.courseRepository) {
      const course = await this.courseRepository.getCourse(booking.courseId);
      if (course) {
        booking.price = (course.price || 0) * durationHours;
      }
    }

    // 1. Handle Auto-Purchase if requested
    if (options.buyNewPack && this.purchaseRepository && this.courseRepository) {
      const course = await this.courseRepository.getCourse(booking.courseId);
      if (!course) throw new Error("找不到課程資訊");

      // Calculate pack hours from course duration_minutes (as standard pack size)
      const totalPackHours = (course.durationMinutes || 60) / 60;
      
      // Create new purchase
      const newPurchase = await this.purchaseRepository.createPurchase({
        studentId: booking.studentId,
        courseId: booking.courseId,
        totalHours: totalPackHours,
        remainingHours: totalPackHours, // Initial full hours
        pricePaid: course.price || 0
      });

      booking.purchaseId = newPurchase.id;

      // 1.5 Initialize Progress if not exists
      if (this.progressRepository) {
        const existingProgress = await this.progressRepository.getByStudentAndCourse(booking.studentId, booking.courseId);
        if (!existingProgress) {
          await this.progressRepository.create({
            student_id: booking.studentId,
            course_id: booking.courseId,
            teacher_id: booking.teacherId,
            status: 'in_progress',
            progress_percentage: 0,
            current_section_id: null,
            completed_section_ids: [],
            teacher_notes: '',
          });
        }
      }
    }

    // 2. Validate & Deduct Purchase (Existing or Newly created above)
    if (booking.purchaseId && this.purchaseRepository) {
      const purchase = await this.purchaseRepository.getPurchaseById(booking.purchaseId);
      if (!purchase) throw new Error("無效的課程包代碼");
      if (purchase.status !== 'active') throw new Error("此課程包已過期或失效");
      if (purchase.studentId !== booking.studentId) throw new Error("無法使用他人的課程包");

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

    // 3. Validate Availability
    if (!options.skipAvailabilityValidation) {
      await this.validateAvailability(booking);
    }

    // 4. Create Booking
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

  private async validateAvailability(booking: Omit<Booking, "id" | "status" | "studentName" | "studentEmail" | "courseTitle"> & {
      requestedSlots?: { date: string; startTime: string; endTime: string; }[];
  }) {
    const { teacherId, bookingDate, startTime, endTime, requestedSlots } = booking;

    // Skip availability validation if it's a request mode booking (handled separately later)
    if (requestedSlots && requestedSlots.length > 0) {
      return;
    }

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
