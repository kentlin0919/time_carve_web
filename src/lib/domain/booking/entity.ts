import { RescheduleRequest } from "./RescheduleRequest";

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
  teacherEmail?: string;
  teacherPhone?: string | null;
  teacherAvatar?: string | null;
  purchaseId?: string | null;
  paidAt?: string | null;
  price?: number;
  // Expanded details for Booking Detail Page
  courseDescription?: string;
  courseSections?: any[]; // Keep flexible for now, or define CourseSection type
  teacherTitle?: string;
  location?: string;
  paymentStatus?: "paid" | "pending" | "refunded";
  paymentMethod?: string; // e.g. "信用卡 (Visa **** 4242)" - likely need to mock or fetch from payment logs
  teacherNotes?: string; // Mapped from booking.notes or separate field?
  homework?: string | null;
  teacherFeedback?: string | null;
  teacherFeedbackVisible?: boolean;
  feedbackUpdatedAt?: string | null;
  rescheduleRequests?: RescheduleRequest[];
}
