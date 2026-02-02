import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { TeacherExperienceRepository } from '@/lib/domain/teacher/ExperienceRepository';
import { CreateTeacherExperienceDTO, TeacherExperience, UpdateTeacherExperienceDTO } from '@/lib/domain/teacher/experience';

export class SupabaseTeacherExperienceRepository implements TeacherExperienceRepository {
  // Use generic database type or any to bypass potential type generation lag in IDE
  constructor(private supabase: SupabaseClient<any>) { }

  async getExperience(teacherId: string): Promise<TeacherExperience[]> {
    const { data, error } = await this.supabase
      .from('teacher_experience')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('end_date', { ascending: false, nullsFirst: true }) // Current jobs first
      .order('start_date', { ascending: false });

    if (error) throw new Error(`Failed to get experience: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    return data;
  }

  async addExperience(teacherId: string, experience: CreateTeacherExperienceDTO): Promise<TeacherExperience> {
    const { data, error } = await this.supabase
      .from('teacher_experience')
      .insert({
        teacher_id: teacherId,
        ...experience,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add experience: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    return data;
  }

  async updateExperience(id: string, experience: UpdateTeacherExperienceDTO): Promise<TeacherExperience> {
    const { data, error } = await this.supabase
      .from('teacher_experience')
      .update(experience)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update experience: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    return data;
  }

  async deleteExperience(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('teacher_experience')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete experience: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
  }
}
