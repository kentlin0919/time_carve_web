export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface StudentCourseProgress {
    id: string;
    student_id: string;
    course_id: string;
    teacher_id: string;
    status: ProgressStatus;
    progress_percentage: number;
    current_section_id: string | null;
    completed_section_ids: string[];
    teacher_notes: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface ProgressRepository {
    getByStudentId(studentId: string): Promise<StudentCourseProgress[]>;
    getByStudentAndCourse(studentId: string, courseId: string): Promise<StudentCourseProgress | null>;
    create(progress: Omit<StudentCourseProgress, 'id' | 'created_at' | 'updated_at'>): Promise<StudentCourseProgress>;
    update(id: string, progress: Partial<StudentCourseProgress>): Promise<StudentCourseProgress>;
}
