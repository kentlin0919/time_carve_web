import { Purchase, PurchaseRepository } from "@/lib/domain/purchase/entity";

export class PurchaseCourseUseCase {
    constructor(private purchaseRepo: PurchaseRepository) { }

    async execute(input: {
        studentId: string;
        courseId: string;
        totalHours: number;
        pricePaid: number;
    }): Promise<Purchase> {
        // Business Logic: 
        // 1. We could validate student exists, course exists (Repo usually enforces FK)
        // 2. Create the purchase record

        // Initial purchase has full remaining hours
        return await this.purchaseRepo.createPurchase({
            studentId: input.studentId,
            courseId: input.courseId,
            totalHours: input.totalHours,
            remainingHours: input.totalHours, // Initially same as total
            pricePaid: input.pricePaid,
        });
    }
}
