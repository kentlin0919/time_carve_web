export interface SlotRequest {
  id: string;
  studentId: string;
  teacherId: string;
  courseId: string;
  status: 'pending' | 'approved' | 'rejected';
  selectedRank?: number;
  rejectReason?: string;
  notes?: string;
  preference1Date: string;
  preference1Start: string;
  preference1End: string;
  preference2Date: string;
  preference2Start: string;
  preference2End: string;
  preference3Date: string;
  preference3Start: string;
  preference3End: string;
  bookingId?: string;
  createdAt?: string;
  updatedAt?: string;

  // Joined properties for display
  studentName?: string;
  studentEmail?: string;
  teacherName?: string;
  courseTitle?: string;
}
