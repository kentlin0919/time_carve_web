"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NotificationList } from "./NotificationList";
import { NotificationDisplay } from "./types";
import {
  getMyNotifications,
  markNotificationAsRead,
} from "@/app/actions/notification";
import { resolveNotificationHref } from "./navigation";

interface NotificationCenterContentProps {
  title: string;
  description: string;
}

export function NotificationCenterContent({
  title,
  description,
}: NotificationCenterContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getMyNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const handleNotificationClick = async (notification: NotificationDisplay) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item
      )
    );

    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    router.push(resolveNotificationHref(pathname, notification));
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <NotificationList
          notifications={notifications}
          onNotificationClick={handleNotificationClick}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
