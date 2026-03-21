import { useState, useEffect } from 'react';
import { Booking } from '@/lib/domain/booking/entity';
import { getStudentBookings, getStudentSlotRequests } from '@/app/actions/booking';
import { SlotRequest } from '@/lib/domain/slot-request/entity';

export function useStudentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotRequests, setSlotRequests] = useState<SlotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const [bookingData, slotRequestData] = await Promise.all([
          getStudentBookings(),
          getStudentSlotRequests(),
        ]);
        setBookings(bookingData);
        setSlotRequests(slotRequestData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "載入預約失敗");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  return { bookings, setBookings, slotRequests, setSlotRequests, loading, error };
}
