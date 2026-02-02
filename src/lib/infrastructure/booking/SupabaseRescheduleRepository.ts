import { RescheduleRequest } from "@/lib/domain/booking/RescheduleRequest";
import { IRescheduleRepository } from "@/lib/domain/booking/RescheduleRepository";
import { supabase as defaultClient } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseRescheduleRepository implements IRescheduleRepository {
    private client: SupabaseClient;

    constructor(client?: SupabaseClient) {
        this.client = client || defaultClient;
    }

    async create(request: Omit<RescheduleRequest, "id" | "createdAt" | "updatedAt" | "status">): Promise<RescheduleRequest> {
        const { data, error } = await this.client
            .from("booking_reschedule_requests")
            .insert({
                booking_id: request.bookingId,
                requested_by: request.requestedBy,
                original_start_time: request.originalStartTime,
                new_start_time: request.newStartTime,
                reason: request.reason,
                status: 'pending' // Default
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create reschedule request: ${error.message}`);
        }

        return this.mapToEntity(data);
    }

    async findById(id: string): Promise<RescheduleRequest | null> {
        const { data, error } = await this.client
            .from("booking_reschedule_requests")
            .select(`
        *,
        booking:bookings (
          id,
          student:student_info (
            user:user_info (name)
          ),
          course:courses (
            title,
            teacher:teacher_info (
               user:user_info (name)
            )
          )
        )
      `)
            .eq("id", id)
            .single();

        if (error) return null;
        return this.mapToEntityWithRelations(data);
    }

    async findByBookingId(bookingId: string): Promise<RescheduleRequest[]> {
        const { data, error } = await this.client
            .from("booking_reschedule_requests")
            .select("*")
            .eq("booking_id", bookingId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching reschedule requests:", error);
            return [];
        }

        return data.map(this.mapToEntity);
    }

    async updateStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
        const { error } = await this.client
            .from("booking_reschedule_requests")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            throw new Error(`Failed to update status: ${error.message}`);
        }
    }

    async update(id: string, data: Partial<RescheduleRequest>): Promise<void> {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (data.newStartTime) updateData.new_start_time = data.newStartTime;
        if (data.reason) updateData.reason = data.reason;
        if (data.status) updateData.status = data.status;

        const { error } = await this.client
            .from("booking_reschedule_requests")
            .update(updateData)
            .eq("id", id);

        if (error) {
            throw new Error(`Failed to update request: ${error.message}`);
        }
    }

    private mapToEntity(data: any): RescheduleRequest {
        return {
            id: data.id,
            bookingId: data.booking_id,
            requestedBy: data.requested_by,
            originalStartTime: data.original_start_time,
            newStartTime: data.new_start_time,
            status: data.status,
            reason: data.reason,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }

    private mapToEntityWithRelations(data: any): RescheduleRequest {
        const entity = this.mapToEntity(data);
        // Add relation data if available from the join
        if (data.booking) {
            entity.studentName = data.booking.student?.user?.name;
            entity.courseTitle = data.booking.course?.title;
            entity.teacherName = data.booking.course?.teacher?.user?.name;
        }
        return entity;
    }
}
