export interface Booking {
  id: string;
  teacherId: string;
  studentId: string;
  courseId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  status: string; // 'pending' | 'confirmed' | 'cancelled' | 'rejected'
  notes?: string | null;
  studentName?: string;
  studentEmail?: string;
  courseTitle?: string;
  courseType?: string;
  coursePrice?: number;
  teacherName?: string;
}
