import { IRescheduleRepository } from "@/lib/domain/booking/RescheduleRepository";
import { RescheduleRequest } from "@/lib/domain/booking/RescheduleRequest";

export class RequestRescheduleUseCase {
    constructor(private rescheduleRepo: IRescheduleRepository) { }

    async execute(input: {
        bookingId: string;
        requestedBy: string;
        originalStartTime: string;
        newStartTime: string;
        reason?: string;
    }): Promise<RescheduleRequest> {

        // Here we might validate if the booking allows rescheduling (e.g. 24h before)
        // For now, simple pass-through creation

        return await this.rescheduleRepo.create({
            bookingId: input.bookingId,
            requestedBy: input.requestedBy,
            originalStartTime: input.originalStartTime,
            newStartTime: input.newStartTime,
            reason: input.reason
        });
    }
}
