export interface RescheduleRequest {
    id: string;
    bookingId: string;
    requestedBy: string;
    originalStartTime: string;
    newStartTime: string;
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    createdAt: string;
    updatedAt: string;

    // Relations
    studentName?: string;
    teacherName?: string;
    courseTitle?: string;
}
