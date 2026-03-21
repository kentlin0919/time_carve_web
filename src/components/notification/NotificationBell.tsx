"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { NotificationList } from "./NotificationList";
import { NotificationDisplay } from "./types";
import {
  getMyNotifications,
  markNotificationAsRead,
} from "@/app/actions/notification";
import { supabase } from "@/lib/supabase";
import { resolveNotificationHref } from "./navigation";
import { Database } from "@/types/database.types";
import { NotificationType } from "@/lib/domain/notification/entity";

function normalizeNotificationData(
  data: Database["public"]["Tables"]["notifications"]["Row"]["data"]
): Record<string, any> | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  return data as Record<string, any>;
}

export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationDisplay[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch initial data and user ID
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const data = await getMyNotifications();
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Realtime Subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("notifications_update")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification =
            payload.new as Database["public"]["Tables"]["notifications"]["Row"];
          // Optimistic update
          const displayNotification: NotificationDisplay = {
            id: newNotification.id,
            userId: newNotification.user_id,
            type: newNotification.type as NotificationType,
            title: newNotification.title,
            content: newNotification.content,
            data: normalizeNotificationData(newNotification.data),
            isRead: newNotification.is_read,
            createdAt: newNotification.created_at, // Payload has string date
          };

          setNotifications((prev) => [displayNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Optional: Browser Notification API could be triggered here
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleNotificationClick = async (notification: NotificationDisplay) => {
    const id = notification.id;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    // Recalculate unread count
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await markNotificationAsRead(id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
      // Revert if failed (optional, but good UX)
    }

    setIsOpen(false);
    router.push(resolveNotificationHref(pathname, notification));
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Optional: Mark all as read when opening? No, user explicitly reads.
    // Standard pattern: Click item to read, or "Mark all read" button (not impl yet).
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">通知中心</h4>
          {/* Future: Mark all read button */}
        </div>
        <NotificationList
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          isLoading={isLoading}
        />
      </PopoverContent>
    </Popover>
  );
}
