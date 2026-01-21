import { AvailabilityRepository } from "@/lib/domain/teacher/AvailabilityRepository";
import { BookingRepository, Booking } from "@/lib/domain/booking/repository";

export interface TimeSlot {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

interface TimeRange {
  start: number; // minutes from midnight
  end: number; // minutes from midnight
}

export class GetAvailableSlotsUseCase {
  constructor(
    private availabilityRepository: AvailabilityRepository,
    private bookingRepository: BookingRepository
  ) {}

  async execute(
    teacherId: string,
    startDate: Date,
    endDate: Date,
    durationMinutes: number
  ): Promise<TimeSlot[]> {
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const [weeklyAvailability, overrides, bookings] = await Promise.all([
      this.availabilityRepository.getWeeklyAvailability(teacherId),
      this.availabilityRepository.getOverrides(teacherId, startStr, endStr),
      this.bookingRepository.getBookings(teacherId, startStr, endStr),
    ]);

    const availableSlots: TimeSlot[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      const dayOfWeek = current.getDay(); // 0 is Sunday

      // 1. Determine Availability Ranges for this day
      let rawRanges: { start: string; end: string }[] = [];

      // Check for overrides first
      const dayOverrides = overrides.filter((o) => o.date === dateStr);
      
      if (dayOverrides.length > 0) {
        // If there's an explicit "unavailable" flag, the day is closed regardless of other slots
        if (!dayOverrides.some((o) => o.isUnavailable)) {
          dayOverrides.forEach((o) => {
             if (o.startTime && o.endTime) {
               rawRanges.push({ start: o.startTime, end: o.endTime });
             }
          });
        }
      } else {
        // Fallback to weekly availability
        const weeklyRules = weeklyAvailability.filter((w) => w.dayOfWeek === dayOfWeek);
        weeklyRules.forEach((w) => {
           if (w.startTime && w.endTime) {
             rawRanges.push({ start: w.startTime, end: w.endTime });
           }
        });
      }

      // 2. Merge contiguous ranges
      const mergedRanges = this.mergeRanges(rawRanges);

      // 3. Generate slots for each merged range
      for (const range of mergedRanges) {
        const slots = this.generateSlots(dateStr, range.start, range.end, durationMinutes);
        
        // 4. Filter overlapping bookings (with Buffer logic)
        const dayBookings = bookings.filter((b) => b.bookingDate === dateStr);
        
        for (const slot of slots) {
          if (!this.isOverlapping(slot, dayBookings)) {
            availableSlots.push(slot);
          }
        }
      }

      // Next day
      current.setDate(current.getDate() + 1);
    }

    return availableSlots;
  }

  // --- Helpers ---

  private toMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  private toTimeStr(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private mergeRanges(ranges: { start: string; end: string }[]): { start: string; end: string }[] {
    if (ranges.length === 0) return [];

    // Convert to minutes for sorting and merging
    const rangesInMins: TimeRange[] = ranges.map(r => ({
      start: this.toMinutes(r.start),
      end: this.toMinutes(r.end)
    }));

    // Sort by start time
    rangesInMins.sort((a, b) => a.start - b.start);

    const merged: TimeRange[] = [];
    let current = rangesInMins[0];

    for (let i = 1; i < rangesInMins.length; i++) {
        const next = rangesInMins[i];
        if (next.start <= current.end) {
            // Overlapping or contiguous, merge
            current.end = Math.max(current.end, next.end);
        } else {
            // Gap found, push current and start new
            merged.push(current);
            current = next;
        }
    }
    merged.push(current);

    return merged.map(r => ({
        start: this.toTimeStr(r.start),
        end: this.toTimeStr(r.end)
    }));
  }

  private generateSlots(date: string, start: string, end: string, duration: number): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let currentMins = this.toMinutes(start);
    const endMins = this.toMinutes(end);

    // Requirement: Slots start every 30 minutes
    while (currentMins + duration <= endMins) {
      slots.push({
        date,
        startTime: this.toTimeStr(currentMins),
        endTime: this.toTimeStr(currentMins + duration),
      });
      // STRICT INTERVAL: 30 minutes
      currentMins += 30; 
    }

    return slots;
  }

  private isOverlapping(slot: TimeSlot, bookings: Booking[]): boolean {
    const slotStart = this.toMinutes(slot.startTime);
    const slotEnd = this.toMinutes(slot.endTime);

    return bookings.some((booking) => {
      const bStart = this.toMinutes(booking.startTime);
      let bEnd = this.toMinutes(booking.endTime);

      // BUFFER LOGIC:
      // If booking is IN-PERSON (default if not 'online'), add 30 min buffer to the END.
      if (booking.courseType !== 'online') {
          bEnd += 30;
      }

      // Overlap logic: (StartA < EndB) and (EndA > StartB)
      return slotStart < bEnd && slotEnd > bStart;
    });
  }
}
