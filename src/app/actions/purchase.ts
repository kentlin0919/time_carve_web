'use server'

import { GetStudentPurchasesUseCase } from "@/lib/application/purchase/GetStudentPurchasesUseCase";
import { PurchaseCourseUseCase } from "@/lib/application/purchase/PurchaseCourseUseCase";
import { SupabasePurchaseRepository } from "@/lib/infrastructure/purchase/SupabasePurchaseRepository";
import { SupabaseProgressRepository } from "@/lib/infrastructure/progress/SupabaseProgressRepository";
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
    const progressRepo = new SupabaseProgressRepository(supabase);
    
    // 1. Create Purchase
    const purchaseUseCase = new PurchaseCourseUseCase(purchaseRepo);
    const purchase = await purchaseUseCase.execute({
        studentId: user.id,
        courseId,
        totalHours,
        pricePaid
    });

    // 2. Initialize Progress (if not exists)
    const existingProgress = await progressRepo.getByStudentAndCourse(user.id, courseId);
    if (!existingProgress) {
        // Get teacherId for this course to link progress
        const { data: courseData } = await supabase.from('courses').select('teacher_id').eq('id', courseId).single();
        if (courseData?.teacher_id) {
            await progressRepo.create({
                student_id: user.id,
                course_id: courseId,
                teacher_id: courseData.teacher_id,
                status: 'in_progress',
                progress_percentage: 0,
                current_section_id: null,
                completed_section_ids: [],
                teacher_notes: '',
            });
        }
    }

    return purchase;
}