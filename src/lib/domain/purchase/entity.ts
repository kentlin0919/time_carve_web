export interface Purchase {
    id: string;
    studentId: string;
    courseId: string;
    totalHours: number;
    remainingHours: number;
    pricePaid: number;
    status: 'active' | 'completed' | 'expired';
    createdAt: string;
    updatedAt: string;
    // Relations (optional)
    courseTitle?: string;
    teacherName?: string;
}

export interface PurchaseRepository {
    createPurchase(purchase: Omit<Purchase, "id" | "createdAt" | "updatedAt" | "status">): Promise<Purchase>;
    getStudentPurchases(studentId: string): Promise<Purchase[]>;
    getPurchaseById(purchaseId: string): Promise<Purchase | null>;
    updateRemainingHours(purchaseId: string, newRemainingHours: number): Promise<void>;
    updateStatus(purchaseId: string, status: Purchase['status']): Promise<void>;
}
