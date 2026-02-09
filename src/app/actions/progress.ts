'use server'

import { createClient } from "@/lib/supabase/server";
import { SupabaseProgressRepository } from "@/lib/infrastructure/progress/SupabaseProgressRepository";
import { StudentCourseProgress, ProgressStatus } from "@/lib/domain/progress/types";
import { SupabaseCourseRepository } from "@/lib/infrastructure/course/SupabaseCourseRepository";
import { Course } from "@/lib/domain/course/entity";

// --- Teacher Actions ---

export async function getStudentCourseProgress(studentId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const repo = new SupabaseProgressRepository(supabase);
    return await repo.getByStudentId(studentId);
}

export async function updateProgress(id: string, data: Partial<StudentCourseProgress>) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    const repo = new SupabaseProgressRepository(supabase);
    return await repo.update(id, data);
}

export async function initializeProgress(studentId: string, courseId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    // Need to get teacher_id (current user)
    const teacherId = user.id;

    const repo = new SupabaseProgressRepository(supabase);

    // Check if already exists
    const existing = await repo.getByStudentAndCourse(studentId, courseId);
    if (existing) return existing;

    const newProgress: Omit<StudentCourseProgress, 'id' | 'created_at' | 'updated_at'> = {
        student_id: studentId,
        course_id: courseId,
        teacher_id: teacherId,
        status: 'not_started',
        progress_percentage: 0,
        current_section_id: null,
        completed_section_ids: [],
        teacher_notes: '',
    };

    return await repo.create(newProgress);
}


// --- Student Actions ---

export async function getMyCourseProgress() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return [];
    }

    const repo = new SupabaseProgressRepository(supabase);
    return await repo.getByStudentId(user.id);
}

export async function getMyCoursesWithProgress() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return [];
    }

    const progressRepo = new SupabaseProgressRepository(supabase);
    const progresses = await progressRepo.getByStudentId(user.id);

    if (progresses.length === 0) return [];

    const courseIds = progresses.map(p => p.course_id);

    // Fetch courses and purchases in parallel
    const courseRepo = new SupabaseCourseRepository(supabase);
    const [courses, purchases] = await Promise.all([
        courseRepo.getByIds(courseIds),
        supabase.from('course_purchases')
            .select('*')
            .eq('student_id', user.id)
            .in('status', ['active', 'pending_payment']) // Fetch both active and pending
    ]);

    return progresses.map(p => {
        const course = courses.find(c => c.id === p.course_id);

        // Filter purchases for this course
        const coursePurchases = purchases.data?.filter(pur => pur.course_id === p.course_id) || [];

        // Calculate active details
        const activePurchase = coursePurchases.find(pur => pur.status === 'active');

        // Calculate total pending hours
        const pendingHours = coursePurchases
            .filter(pur => pur.status === 'pending_payment')
            .reduce((sum, pur) => sum + pur.total_hours, 0);

        return {
            ...p,
            course,
            purchase: {
                totalHours: activePurchase?.total_hours || 0,
                remainingHours: activePurchase?.remaining_hours || 0,
                pendingHours: pendingHours,
                id: activePurchase?.id || ''
            }
        };
    }).filter(item => item.course !== undefined) as (StudentCourseProgress & {
        course: Course,
        purchase: {
            totalHours: number;
            remainingHours: number;
            pendingHours: number;
            id: string;
        } | null
    })[];
}

export async function getPendingHoursForCourse(courseId: string): Promise<number> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return 0;
    }

    const { data: purchases } = await supabase
        .from('course_purchases')
        .select('total_hours')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'pending_payment');

    if (!purchases || purchases.length === 0) {
        return 0;
    }

    return purchases.reduce((sum, pur) => sum + pur.total_hours, 0);
}
