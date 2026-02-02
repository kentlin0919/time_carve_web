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
  purchaseId?: string | null;
  paidAt?: string | null;
  price?: number;
  // Reschedule info
  rescheduleRequests?: any[]; // Avoiding circular dependency or import issues, simplify as any[] or generic types for now. 
  // Ideally import { RescheduleRequest } from "./RescheduleRequest";
}
