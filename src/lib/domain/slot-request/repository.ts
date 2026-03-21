import { SlotRequest } from "./entity";

export interface SlotRequestRepository {
  createSlotRequest(request: Omit<SlotRequest, "id" | "status" | "createdAt" | "updatedAt">): Promise<SlotRequest>;
  getSlotRequestById(id: string): Promise<SlotRequest | null>;
  getSlotRequestsByStudentId(studentId: string): Promise<SlotRequest[]>;
  getSlotRequestsByTeacherId(teacherId: string): Promise<SlotRequest[]>;
  getPendingSlotRequestsByTeacherIdAndDateRange(teacherId: string, startDate: string, endDate: string): Promise<SlotRequest[]>;
  updateSlotRequestStatus(id: string, updates: { 
    status: 'approved' | 'rejected', 
    selectedRank?: number, 
    rejectReason?: string, 
    bookingId?: string 
  }): Promise<void>;
}
