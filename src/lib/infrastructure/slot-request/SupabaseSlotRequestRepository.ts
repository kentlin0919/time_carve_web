import { SupabaseClient } from "@supabase/supabase-js";
import { SlotRequest } from "@/lib/domain/slot-request/entity";
import { SlotRequestRepository } from "@/lib/domain/slot-request/repository";

export class SupabaseSlotRequestRepository implements SlotRequestRepository {
  constructor(private supabase: SupabaseClient) {}

  private mapToEntity(dbRecord: any): SlotRequest {
    return {
      id: dbRecord.id,
      studentId: dbRecord.student_id,
      teacherId: dbRecord.teacher_id,
      courseId: dbRecord.course_id,
      status: dbRecord.status,
      selectedRank: dbRecord.selected_rank,
      rejectReason: dbRecord.reject_reason,
      notes: dbRecord.notes,
      preference1Date: dbRecord.preference_1_date,
      preference1Start: dbRecord.preference_1_start,
      preference1End: dbRecord.preference_1_end,
      preference2Date: dbRecord.preference_2_date,
      preference2Start: dbRecord.preference_2_start,
      preference2End: dbRecord.preference_2_end,
      preference3Date: dbRecord.preference_3_date,
      preference3Start: dbRecord.preference_3_start,
      preference3End: dbRecord.preference_3_end,
      bookingId: dbRecord.booking_id,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
      studentName:
        dbRecord.student?.user?.name ||
        dbRecord.student?.user_info?.name ||
        dbRecord.student_info?.user?.name ||
        dbRecord.student_info?.user_info?.name ||
        "",
      studentEmail:
        dbRecord.student?.user?.email ||
        dbRecord.student?.user_info?.email ||
        dbRecord.student_info?.user?.email ||
        dbRecord.student_info?.user_info?.email ||
        "",
      teacherName:
        dbRecord.teacher?.user?.name ||
        dbRecord.teacher?.user_info?.name ||
        dbRecord.teacher_info?.user?.name ||
        dbRecord.teacher_info?.user_info?.name ||
        "",
      courseTitle: dbRecord.course?.title || dbRecord.courses?.title || "",
    };
  }

  async createSlotRequest(request: Omit<SlotRequest, "id" | "status" | "createdAt" | "updatedAt">): Promise<SlotRequest> {
    const { data, error } = await this.supabase
      .from("slot_requests")
      .insert([
        {
          student_id: request.studentId,
          teacher_id: request.teacherId,
          course_id: request.courseId,
          notes: request.notes,
          preference_1_date: request.preference1Date,
          preference_1_start: request.preference1Start,
          preference_1_end: request.preference1End,
          preference_2_date: request.preference2Date,
          preference_2_start: request.preference2Start,
          preference_2_end: request.preference2End,
          preference_3_date: request.preference3Date,
          preference_3_start: request.preference3Start,
          preference_3_end: request.preference3End,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create slot request: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async getSlotRequestById(id: string): Promise<SlotRequest | null> {
    const { data, error } = await this.supabase
      .from("slot_requests")
      .select(`
        *,
        student:student_info!slot_requests_student_id_fkey (
          user_info (
            name,
            email
          )
        ),
        teacher:teacher_info!slot_requests_teacher_id_fkey (
          user_info (
            name
          )
        ),
        course:courses!slot_requests_course_id_fkey (
          title
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Failed to get slot request: ${error.message}`);
    }

    return this.mapToEntity(data);
  }

  async getSlotRequestsByStudentId(studentId: string): Promise<SlotRequest[]> {
    const { data, error } = await this.supabase
      .from("slot_requests")
      .select(`
        *,
        teacher:teacher_info!slot_requests_teacher_id_fkey (
          user_info (
            name
          )
        ),
        course:courses!slot_requests_course_id_fkey (
          title
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get slot requests for student: ${error.message}`);
    }

    return data.map(this.mapToEntity);
  }

  async getSlotRequestsByTeacherId(teacherId: string): Promise<SlotRequest[]> {
    const { data, error } = await this.supabase
      .from("slot_requests")
      .select(`
        *,
        student:student_info!slot_requests_student_id_fkey (
          user_info (
            name,
            email
          )
        ),
        course:courses!slot_requests_course_id_fkey (
          title
        )
      `)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get slot requests for teacher: ${error.message}`);
    }

    return data.map(this.mapToEntity);
  }

  async getPendingSlotRequestsByTeacherIdAndDateRange(
    teacherId: string,
    startDate: string,
    endDate: string
  ): Promise<SlotRequest[]> {
    const { data, error } = await this.supabase
      .from("slot_requests")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("status", "pending")
      // We check all three preference dates; filter server-side for simplicity
      // and refine client-side if needed. Fetching pending requests in a broad range.
      .or(
        `preference_1_date.gte.${startDate},preference_2_date.gte.${startDate},preference_3_date.gte.${startDate}`
      )
      .or(
        `preference_1_date.lte.${endDate},preference_2_date.lte.${endDate},preference_3_date.lte.${endDate}`
      );

    if (error) {
      throw new Error(`Failed to get pending slot requests: ${error.message}`);
    }

    return (data ?? []).map((r: any) => this.mapToEntity(r));
  }

  async updateSlotRequestStatus(id: string, updates: { 
    status: 'approved' | 'rejected', 
    selectedRank?: number, 
    rejectReason?: string, 
    bookingId?: string 
  }): Promise<void> {
    const updateData: any = { status: updates.status, updated_at: new Date().toISOString() };
    if (updates.selectedRank !== undefined) updateData.selected_rank = updates.selectedRank;
    if (updates.rejectReason !== undefined) updateData.reject_reason = updates.rejectReason;
    if (updates.bookingId !== undefined) updateData.booking_id = updates.bookingId;

    const { error } = await this.supabase
      .from("slot_requests")
      .update(updateData)
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to update slot request status: ${error.message}`);
    }
  }
}
