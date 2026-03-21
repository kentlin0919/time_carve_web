'use server'

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SupabaseNotificationRepository } from "@/lib/infrastructure/notification/SupabaseNotificationRepository";
import { GetMyNotificationsUseCase } from "@/lib/application/notification/GetMyNotificationsUseCase";
import { MarkNotificationReadUseCase } from "@/lib/application/notification/MarkNotificationReadUseCase";
import { SendNotificationUseCase } from "@/lib/application/notification/SendNotificationUseCase";
import { NotificationType } from "@/lib/domain/notification/entity";

export async function getMyNotifications() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const repo = new SupabaseNotificationRepository(supabase);
  const useCase = new GetMyNotificationsUseCase(repo);
  const notifications = await useCase.execute(user.id);
  
  // Serialize dates
  return notifications.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString()
  }));
}

export async function markNotificationAsRead(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const repo = new SupabaseNotificationRepository(supabase);
  const useCase = new MarkNotificationReadUseCase(repo);
  await useCase.execute(id);
}

export async function sendNotification(
  targetUserId: string,
  type: NotificationType,
  title: string,
  content: string,
  data?: any
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  // Use Admin Client to send (bypass Insert RLS)
  const adminSupabase = createAdminClient();
  const repo = new SupabaseNotificationRepository(adminSupabase);
  const useCase = new SendNotificationUseCase(repo);
  
  await useCase.execute(targetUserId, type, title, content, data);

  // Trigger the generic edge function to send an email asynchronously
  try {
    const { data: userData } = await adminSupabase
      .from('user_info')
      .select('email, name')
      .eq('id', targetUserId)
      .single();

    if (userData?.email) {
      const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>${title}</h2>
          <p>您好${userData.name ? ' ' + userData.name : ''}，</p>
          <p>${content}</p>
          <hr />
          <p style="font-size: 12px; color: #666;">TimeCarve 刻時家教平台</p>
        </div>
      `;

      // invoke edge function without awaiting to allow background processing
      adminSupabase.functions.invoke('send-email', {
        body: {
          to: userData.email,
          subject: `[系統通知] ${title}`,
          html: htmlContent
        }
      }).then(({ error }) => {
        if (error) console.error("Failed to invoke send-email edge function:", error);
      });
    }
  } catch (error) {
    console.error("Error triggering email notification:", error);
  }
}
