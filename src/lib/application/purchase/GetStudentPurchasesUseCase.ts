import { Purchase, PurchaseRepository } from "@/lib/domain/purchase/entity";

export class GetStudentPurchasesUseCase {
    constructor(private purchaseRepository: PurchaseRepository) { }

    async execute(studentId: string): Promise<Purchase[]> {
        return await this.purchaseRepository.getStudentPurchases(studentId);
    }
}
