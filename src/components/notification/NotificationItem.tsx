"use client";

import { NotificationDisplay } from "./types";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Bell, Calendar, Info } from "lucide-react";

interface NotificationItemProps {
  notification: NotificationDisplay;
  onClick: (notification: NotificationDisplay) => void;
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const Icon =
    notification.type === "BOOKING"
      ? Calendar
      : notification.type === "SYSTEM"
      ? Info
      : Bell;

  return (
    <div
      onClick={() => onClick(notification)}
      className={cn(
        "flex items-start gap-3 p-3 cursor-pointer hover:bg-zinc-100 transition-colors border-b last:border-b-0",
        !notification.isRead && "bg-blue-50 hover:bg-blue-100"
      )}
    >
      <div className="mt-1">
        <Icon className="w-5 h-5 text-zinc-500" />
      </div>
      <div className="flex-1 space-y-1">
        <p
          className={cn(
            "text-sm font-medium leading-none",
            !notification.isRead && "text-blue-700"
          )}
        >
          {notification.title}
        </p>
        <p className="text-sm text-zinc-500 line-clamp-2">
          {notification.content}
        </p>
        <p className="text-xs text-zinc-400">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: zhTW,
          })}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 mt-2 bg-blue-600 rounded-full" />
      )}
    </div>
  );
}
