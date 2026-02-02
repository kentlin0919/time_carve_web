import { SupabaseClient } from '@supabase/supabase-js';
import { ProgressRepository, StudentCourseProgress, ProgressStatus } from '@/lib/domain/progress/types';
import { Database } from '@/types/database.types';

export class SupabaseProgressRepository implements ProgressRepository {
    constructor(private supabase: SupabaseClient<Database>) { }

    private mapToEntity(row: Database['public']['Tables']['student_course_progress']['Row']): StudentCourseProgress {
        return {
            id: row.id,
            student_id: row.student_id,
            course_id: row.course_id,
            teacher_id: row.teacher_id,
            status: row.status as ProgressStatus,
            progress_percentage: row.progress_percentage || 0,
            current_section_id: row.current_section_id,
            completed_section_ids: Array.isArray(row.completed_section_ids) ? row.completed_section_ids.map(String) : [],
            teacher_notes: row.teacher_notes,
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at),
        };
    }

    async getByStudentId(studentId: string): Promise<StudentCourseProgress[]> {
        const { data, error } = await this.supabase
            .from('student_course_progress')
            .select('*')
            .eq('student_id', studentId);

        if (error) throw new Error(`Failed to get progress by student: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
        return data.map(this.mapToEntity);
    }

    async getByStudentAndCourse(studentId: string, courseId: string): Promise<StudentCourseProgress | null> {
        const { data, error } = await this.supabase
            .from('student_course_progress')
            .select('*')
            .eq('student_id', studentId)
            .eq('course_id', courseId)
            .maybeSingle();

        if (error) throw new Error(`Failed to get progress by student and course: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
        return data ? this.mapToEntity(data) : null;
    }

    async create(progress: Omit<StudentCourseProgress, 'id' | 'created_at' | 'updated_at'>): Promise<StudentCourseProgress> {
        const { data, error } = await this.supabase
            .from('student_course_progress')
            .insert({
                student_id: progress.student_id,
                course_id: progress.course_id,
                teacher_id: progress.teacher_id,
                status: progress.status,
                progress_percentage: progress.progress_percentage,
                current_section_id: progress.current_section_id,
                completed_section_ids: progress.completed_section_ids,
                teacher_notes: progress.teacher_notes,
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create progress: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
        return this.mapToEntity(data);
    }

    async update(id: string, progress: Partial<StudentCourseProgress>): Promise<StudentCourseProgress> {
        const updateData: any = { ...progress };
        // Remove fields that shouldn't be updated or need undefined checks
        delete updateData.id;
        delete updateData.created_at;
        delete updateData.updated_at;

        // Explicitly handle updated_at
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await this.supabase
            .from('student_course_progress')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update progress: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
        return this.mapToEntity(data);
    }
}
