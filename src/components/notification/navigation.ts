import { NotificationDisplay } from "./types";

type AppRole = "student" | "teacher" | "admin";

function getRoleFromPathname(pathname: string): AppRole {
  if (pathname.startsWith("/teacher")) return "teacher";
  if (pathname.startsWith("/admin")) return "admin";
  return "student";
}

export function resolveNotificationHref(
  pathname: string,
  notification: NotificationDisplay
): string {
  const role = getRoleFromPathname(pathname);
  const data = notification.data ?? {};

  if (role === "student") {
    if (typeof data.bookingId === "string" && data.bookingId.length > 0) {
      return `/student/bookings/${data.bookingId}`;
    }
    if (typeof data.slotRequestId === "string" && data.slotRequestId.length > 0) {
      return "/student/bookings";
    }
    return "/student/notifications";
  }

  if (role === "teacher") {
    if (
      typeof data.bookingId === "string" ||
      typeof data.slotRequestId === "string" ||
      notification.type === "BOOKING"
    ) {
      return "/teacher/bookings";
    }
    return "/teacher/notifications";
  }

  return "/admin/dashboard";
}
