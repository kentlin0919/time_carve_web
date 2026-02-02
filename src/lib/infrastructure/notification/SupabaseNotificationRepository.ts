import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { Notification, NotificationType } from '@/lib/domain/notification/entity';
import { NotificationRepository } from '@/lib/domain/notification/repository';

export class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private supabase: SupabaseClient<Database>) { }

  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch notifications: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);

    return data.map(this.mapToEntity);
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw new Error(`Failed to mark notification as read: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
  }

  async createNotification(userId: string, type: NotificationType, title: string, content: string, data?: Record<string, any>): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        content,
        // @ts-ignore: JSONB type compatibility
        data: data || null,
      });

    if (error) throw new Error(`Failed to create notification: ${error.message} (Details: ${error.details || 'none'}, Hint: ${error.hint || 'none'})`);
  }

  private mapToEntity(row: Database['public']['Tables']['notifications']['Row']): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType,
      title: row.title,
      content: row.content,
      data: row.data as Record<string, any> | null,
      isRead: row.is_read,
      createdAt: new Date(row.created_at),
    };
  }
}
