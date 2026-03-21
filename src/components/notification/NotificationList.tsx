"use client";

import { NotificationDisplay } from "./types";
import { NotificationItem } from "./NotificationItem";
import { BellOff } from "lucide-react";

interface NotificationListProps {
  notifications: NotificationDisplay[];
  onNotificationClick: (notification: NotificationDisplay) => void;
  isLoading: boolean;
}

export function NotificationList({
  notifications,
  onNotificationClick,
  isLoading,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-zinc-500">載入中...</div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-zinc-500">
        <BellOff className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">目前沒有新通知</p>
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={onNotificationClick}
        />
      ))}
    </div>
  );
}
