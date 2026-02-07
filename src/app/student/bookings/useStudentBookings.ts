import { useState, useEffect } from 'react';
import { Booking } from '@/lib/domain/booking/entity';
import { getStudentBookings } from '@/app/actions/booking';

export function useStudentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const data = await getStudentBookings();
        setBookings(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "載入預約失敗");
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  return { bookings, setBookings, loading, error };
}
