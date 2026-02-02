"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { RescheduleDialog } from "@/components/bookings/RescheduleDialog";

// Booking Type Definition
type BookingWithDetails = Database["public"]["Tables"]["bookings"]["Row"] & {
  courses: Database["public"]["Tables"]["courses"]["Row"] | null;
  teacher_info:
  | (Database["public"]["Tables"]["teacher_info"]["Row"] & {
    user_info: Database["public"]["Tables"]["user_info"]["Row"] | null;
  })
  | null;
  booking_statuses:
  | Database["public"]["Tables"]["booking_statuses"]["Row"]
  | null;
  reschedule_requests: Database["public"]["Tables"]["booking_reschedule_requests"]["Row"][];
};

// Helper for status styling
const getStatusTheme = (status: string) => {
  switch (status) {
    case "confirmed":
    case "completed":
      return "green";
    case "pending":
      return "orange";
    case "cancelled":
    case "rejected":
      return "red";
    default:
      return "blue";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "confirmed":
      return "已確認";
    case "completed":
      return "已完成";
    case "pending":
      return "待確認";
    case "cancelled":
      return "已取消";
    case "rejected":
      return "已拒絕";
    default:
      return status;
  }
};

export default function StudentBookingsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming"
  );
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // First get student ID
      const { data: studentData, error: studentError } = await supabase
        .from("student_info")
        .select("id")
        .eq("id", user.id)
        .single();

      if (studentError || !studentData) {
        console.error("Error fetching student info:", studentError);
        return;
      }

      // Fetch bookings with relations
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          courses (*),
          teacher_info (
            *,
            user_info (name)
          ),
          booking_statuses (*),
          reschedule_requests:booking_reschedule_requests (*)
        `
        )
        .eq("student_id", studentData.id)
        .order("booking_date", { ascending: false });

      if (error) {
        console.error("Supabase Fetch Error:", JSON.stringify(error, null, 2));
        throw error;
      }

      setBookings((data as unknown as BookingWithDetails[]) || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    // Filter by tab
    const bookingDate = new Date(
      `${booking.booking_date}T${booking.start_time}`
    );
    const now = new Date();

    // Determine status
    const status = booking.booking_statuses?.status_key || "";
    const isHistory =
      bookingDate < now ||
      ["completed", "cancelled", "rejected"].includes(status);

    if (activeTab === "upcoming" && isHistory) return false;
    if (activeTab === "history" && !isHistory) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const courseTitle = booking.courses?.title?.toLowerCase() || "";
      const teacherName =
        booking.teacher_info?.user_info?.name?.toLowerCase() || "";
      return courseTitle.includes(query) || teacherName.includes(query);
    }

    return true;
  });

  return (
    <div className="container mx-auto max-w-[1280px] p-6 md:p-10 flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
        <div>
          <h1 className="text-slate-900 dark:text-white text-3xl font-display font-black leading-tight tracking-tight mb-2">
            我的預約記錄
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            查看並管理您的所有課程預約狀態
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/student/courses"
            className="bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-dark dark:text-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-200 dark:shadow-none transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">
              add_circle
            </span>
            預約新課程
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft sticky top-[73px] md:top-0 z-20 transition-all">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex w-full lg:w-auto">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all border ${activeTab === "upcoming"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white border-slate-200 dark:border-slate-600"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent"
                }`}
            >
              即將到來
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all border ${activeTab === "history"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white border-slate-200 dark:border-slate-600"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent"
                }`}
            >
              歷史記錄
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 w-full sm:w-64 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary trans-all text-[20px]">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary text-slate-700 dark:text-white placeholder-slate-400 outline-none trans-all"
                placeholder="搜尋課程名稱、教師..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Booking List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400">載入中...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
              event_busy
            </span>
            <p className="text-lg font-medium">沒有找到相關的預約</p>
            {activeTab === "upcoming" && (
              <Link
                href="/student/courses"
                className="mt-4 text-primary hover:underline font-bold"
              >
                去瀏覽課程
              </Link>
            )}
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingWithDetails }) {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const dateObj = new Date(booking.booking_date);
  const month = `${dateObj.getMonth() + 1}月`;
  const date = String(dateObj.getDate()).padStart(2, "0");
  const dayWeek = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][
    dateObj.getDay()
  ];

  // Calculate duration
  const start = new Date(`2000-01-01T${booking.start_time}`);
  const end = new Date(`2000-01-01T${booking.end_time}`);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  const duration =
    durationMinutes >= 60
      ? `${durationMinutes / 60}小時`
      : `${durationMinutes}分鐘`;

  const timeRange = `${booking.start_time.slice(
    0,
    5
  )} - ${booking.end_time.slice(0, 5)}`;

  const status = booking.booking_statuses?.status_key || "pending";
  const themeName = getStatusTheme(status);

  const pendingReschedule = booking.reschedule_requests?.find(
    (r) => r.status === "pending"
  );

  const themeColors = {
    green: {
      bar: "bg-green-500",
      dateBg: "bg-green-50 dark:bg-green-900/20",
      dateText: "text-green-700 dark:text-green-400",
      dateBorder: "border-green-100 dark:border-green-900/30",
      badgeBg: "bg-green-100 dark:bg-green-900/40",
      badgeText: "text-green-700 dark:text-green-400",
      icon: "check_circle",
    },
    orange: {
      bar: "bg-orange-400",
      dateBg: "bg-orange-50 dark:bg-orange-900/20",
      dateText: "text-orange-600 dark:text-orange-400",
      dateBorder: "border-orange-100 dark:border-orange-900/30",
      badgeBg: "bg-orange-100 dark:bg-orange-900/40",
      badgeText: "text-orange-700 dark:text-orange-400",
      icon: "hourglass_top",
    },
    blue: {
      bar: "bg-blue-500",
      dateBg: "bg-slate-100 dark:bg-slate-800",
      dateText: "text-slate-600 dark:text-slate-400",
      dateBorder: "border-slate-200 dark:border-slate-700",
      badgeBg: "bg-blue-100 dark:bg-blue-900/40",
      badgeText: "text-blue-700 dark:text-blue-400",
      icon: "event_available",
    },
    red: {
      bar: "bg-red-500",
      dateBg: "bg-red-50 dark:bg-red-900/20",
      dateText: "text-red-600 dark:text-red-400",
      dateBorder: "border-red-100 dark:border-red-900/30",
      badgeBg: "bg-red-100 dark:bg-red-900/40",
      badgeText: "text-red-700 dark:text-red-400",
      icon: "cancel",
    },
  };

  const theme = themeColors[themeName as keyof typeof themeColors];

  return (
    <>
      <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 trans-all group relative overflow-hidden transition-all duration-300">
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.bar}`}
        ></div>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Date Box */}
          <div
            className={`flex-shrink-0 w-full md:w-20 h-16 md:h-20 ${theme.dateBg} rounded-xl flex flex-row md:flex-col items-center justify-center md:justify-center gap-3 md:gap-0 ${theme.dateText} border ${theme.dateBorder}`}
          >
            <span className="text-sm font-bold uppercase tracking-wider">
              {month}
            </span>
            <span className="text-2xl md:text-3xl font-black font-display leading-none">
              {date}
            </span>
            <span className="md:hidden font-bold">{dayWeek}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
            <div className="lg:col-span-5 flex flex-col justify-center gap-1">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg md:text-xl truncate">
                {booking.courses?.title || "未知課程"}
              </h3>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                <span className="material-symbols-outlined text-[18px]">
                  school
                </span>
                <span>{booking.courses?.course_type || "一般課程"}</span>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-center gap-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined text-[18px] text-slate-400">
                  schedule
                </span>
                <span className="font-medium">
                  {timeRange} ({duration})
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined text-[18px] text-slate-400">
                  person
                </span>
                <span>
                  {booking.teacher_info?.user_info?.name ||
                    booking.teacher_info?.title ||
                    "指導老師"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined text-[18px] text-slate-400">
                  location_on
                </span>
                <span>{booking.courses?.location || "線上/實體"}</span>
              </div>
            </div>
            <div className="lg:col-span-3 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${theme.badgeBg
                  } ${theme.badgeText} ${status === "pending" ? "animate-pulse" : ""
                  }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {theme.icon}
                </span>
                {getStatusLabel(status)}
              </span>

              {pendingReschedule ? (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    schedule
                  </span>
                  改期申請中
                </span>
              ) : status === "confirmed" || status === "pending" ? (
                <button
                  onClick={() => setIsRescheduleOpen(true)}
                  className="text-xs font-bold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors px-2 py-1 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    edit_calendar
                  </span>
                  申請改期
                </button>
              ) : null}

              <div className="flex items-center gap-2">
                <Link
                  href={`/student/bookings/${booking.id}`}
                  className="text-xs font-bold text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors px-2 py-1"
                >
                  查看詳情
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RescheduleDialog
        bookingId={booking.id}
        open={isRescheduleOpen}
        onOpenChange={setIsRescheduleOpen}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
