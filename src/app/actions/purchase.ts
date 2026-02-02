'use server'

import { GetStudentPurchasesUseCase } from "@/lib/application/purchase/GetStudentPurchasesUseCase";
import { PurchaseCourseUseCase } from "@/lib/application/purchase/PurchaseCourseUseCase";
import { SupabasePurchaseRepository } from "@/lib/infrastructure/purchase/SupabasePurchaseRepository";
import { createClient } from "@/lib/supabase/server";

export async function getStudentPurchases() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const purchaseRepo = new SupabasePurchaseRepository(supabase);
    const useCase = new GetStudentPurchasesUseCase(purchaseRepo);

    return await useCase.execute(user.id);
}

export async function purchaseCourse(courseId: string, totalHours: number, pricePaid: number) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const purchaseRepo = new SupabasePurchaseRepository(supabase);
    const useCase = new PurchaseCourseUseCase(purchaseRepo);

    return await useCase.execute({
        studentId: user.id,
        courseId,
        totalHours,
        pricePaid
    });
}
