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
    const courseRepo = new SupabaseCourseRepository(supabase);
    const courses = await courseRepo.getByIds(courseIds);

    return progresses.map(p => {
        const course = courses.find(c => c.id === p.course_id);
        return { ...p, course };
    }).filter(item => item.course !== undefined) as (StudentCourseProgress & { course: Course })[];
}
