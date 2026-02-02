import { RescheduleRequest } from "./RescheduleRequest";

export interface IRescheduleRepository {
    create(request: Omit<RescheduleRequest, "id" | "createdAt" | "updatedAt" | "status">): Promise<RescheduleRequest>;
    findById(id: string): Promise<RescheduleRequest | null>;
    findByBookingId(bookingId: string): Promise<RescheduleRequest[]>;
    updateStatus(id: string, status: 'approved' | 'rejected'): Promise<void>;
    update(id: string, data: Partial<RescheduleRequest>): Promise<void>;
}
