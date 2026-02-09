import { Purchase, PurchaseRepository } from "@/lib/domain/purchase/entity";
import { supabase as defaultClient } from "@/lib/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabasePurchaseRepository implements PurchaseRepository {
    private client: SupabaseClient;

    constructor(client?: SupabaseClient) {
        this.client = client || defaultClient;
    }

    async createPurchase(purchase: Omit<Purchase, "id" | "createdAt" | "updatedAt" | "status">): Promise<Purchase> {
        const { data, error } = await this.client
            .from("course_purchases")
            .insert({
                student_id: purchase.studentId,
                course_id: purchase.courseId,
                total_hours: purchase.totalHours,
                remaining_hours: purchase.remainingHours,
                price_paid: purchase.pricePaid,
                status: 'pending_payment'
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create purchase: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);

        return this.mapToEntity(data);
    }

    async getStudentPurchases(studentId: string): Promise<Purchase[]> {
        const { data, error } = await this.client
            .from("course_purchases")
            .select(`
        *,
        course:courses (
            title,
            teacher:teacher_info (
                user:user_info ( name )
            )
        )
      `)
            .eq("student_id", studentId)
            .order("created_at", { ascending: false });

        if (error) throw new Error(`Failed to get student purchases: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);

        return data.map(this.mapToEntity);
    }

    async getPurchaseById(purchaseId: string): Promise<Purchase | null> {
        const { data, error } = await this.client
            .from("course_purchases")
            .select("*")
            .eq("id", purchaseId)
            .single();

        if (error) return null;
        return this.mapToEntity(data);
    }

    async updateRemainingHours(purchaseId: string, newRemainingHours: number): Promise<void> {
        const { error } = await this.client
            .from("course_purchases")
            .update({ remaining_hours: newRemainingHours })
            .eq("id", purchaseId);

        if (error) throw new Error(`Failed to update remaining hours: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    }

    async updateStatus(purchaseId: string, status: Purchase['status']): Promise<void> {
        const { error } = await this.client
            .from("course_purchases")
            .update({ status: status })
            .eq("id", purchaseId);

        if (error) throw new Error(`Failed to update status: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
    }

    private mapToEntity(data: any): Purchase {
        return {
            id: data.id,
            studentId: data.student_id,
            courseId: data.course_id,
            totalHours: Number(data.total_hours),
            remainingHours: Number(data.remaining_hours),
            pricePaid: Number(data.price_paid),
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            courseTitle: data.course?.title,
            teacherName: data.course?.teacher?.user?.name
        };
    }
}
