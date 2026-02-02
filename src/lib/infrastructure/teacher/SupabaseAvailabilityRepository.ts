import { AvailabilityRepository, TeacherAvailabilityWeekly, TeacherAvailabilityOverride } from "@/lib/domain/teacher/AvailabilityRepository";
import { supabase as defaultClient } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseAvailabilityRepository implements AvailabilityRepository {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client || defaultClient;
  }

  async getWeeklyAvailability(teacherId: string): Promise<TeacherAvailabilityWeekly[]> {
    const { data, error } = await this.client
      .from("teacher_availability_weekly")
      .select("*")
      .eq("teacher_id", teacherId);

    if (error) {
      console.error("Error fetching weekly availability:", error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      teacherId: item.teacher_id,
      dayOfWeek: item.day_of_week,
      startTime: item.start_time,
      endTime: item.end_time,
    }));
  }

  async getOverrides(teacherId: string, startDate: string, endDate: string): Promise<TeacherAvailabilityOverride[]> {
    const { data, error } = await this.client
      .from("teacher_availability_overrides")
      .select("*")
      .eq("teacher_id", teacherId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) {
      console.error("Error fetching availability overrides:", error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      teacherId: item.teacher_id,
      date: item.date,
      startTime: item.start_time,
      endTime: item.end_time,
      isUnavailable: item.is_unavailable || false,
    }));
  }

  async saveWeeklyAvailability(teacherId: string, availability: Omit<TeacherAvailabilityWeekly, "id">[]): Promise<void> {
    // Transaction-like behavior: delete existing for this teacher, then insert new
    // Note: Supabase doesn't support transactions in client-side JS directly without RPC, 
    // but for now we can do delete then insert. 
    // A better approach might be to upsert or use a specific RPC if atomic safety is critical.

    // 1. Delete existing weekly availability for this teacher
    const { error: deleteError } = await this.client
      .from("teacher_availability_weekly")
      .delete()
      .eq("teacher_id", teacherId);

    if (deleteError) {
      throw new Error(`Failed to delete existing availability: ${deleteError.message} (Details: ${deleteError.details || 'none'}, Hint: ${deleteError.hint || 'none'})`);
    }

    // 2. Insert new availability
    if (availability.length > 0) {
      const { error: insertError } = await this.client
        .from("teacher_availability_weekly")
        .insert(
          availability.map(item => ({
            teacher_id: teacherId,
            day_of_week: item.dayOfWeek,
            start_time: item.startTime,
            end_time: item.endTime,
          }))
        );

      if (insertError) {
        throw new Error(`Failed to insert new availability: ${insertError.message} (Details: ${insertError.details || 'none'}, Hint: ${insertError.hint || 'none'})`);
      }
    }
  }

  async saveOverrides(teacherId: string, date: string, overrides: Omit<TeacherAvailabilityOverride, "id">[]): Promise<void> {
    // 1. Delete existing overrides for this teacher and date
    const { error: deleteError } = await this.client
      .from("teacher_availability_overrides")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("date", date);

    if (deleteError) {
      throw new Error(`Failed to delete existing overrides: ${deleteError.message} (Details: ${deleteError.details || 'none'}, Hint: ${deleteError.hint || 'none'})`);
    }

    // 2. Insert new overrides
    if (overrides.length > 0) {
      const { error: insertError } = await this.client
        .from("teacher_availability_overrides")
        .insert(
          overrides.map(override => ({
            teacher_id: teacherId,
            date: override.date,
            start_time: override.startTime,
            end_time: override.endTime,
            is_unavailable: override.isUnavailable,
          }))
        );

      if (insertError) {
        throw new Error(`Failed to save overrides: ${insertError.message} (Details: ${insertError.details || 'none'}, Hint: ${insertError.hint || 'none'})`);
      }
    }
  }

  async deleteOverride(overrideId: string): Promise<void> {
    const { error } = await this.client
      .from("teacher_availability_overrides")
      .delete()
      .eq("id", overrideId);

    if (error) {
      throw new Error(`Failed to delete override: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    }
  }
}
