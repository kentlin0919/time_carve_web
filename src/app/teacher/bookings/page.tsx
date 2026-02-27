"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getTeacherBookings, getTeacherPendingBookings, updateBookingFeedback } from "@/app/actions/booking";
import { getTeacherProfile } from "@/app/actions/teacher";
import { getTeacherAvailability } from "@/app/teacher/availability/actions";
import { Booking } from "@/lib/domain/booking/entity";
import { TeacherProfile } from "@/lib/domain/teacher/entity";
import { EditBookingDialog } from "@/components/teacher/bookings/EditBookingDialog";
import { CreateBookingDialog } from "@/components/teacher/bookings/CreateBookingDialog";
import { ReviewRescheduleDialog } from "@/components/bookings/ReviewRescheduleDialog";
import { useModal } from "@/components/providers/ModalContext";

export default function TeacherBookingsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]); // New State
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { showModal } = useModal();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [availability, setAvailability] = useState<
    { date: string; slots: { start: string; end: string }[]; isUnavailable: boolean }[]
  >([]);
  const [feedbackDrafts, setFeedbackDrafts] = useState<
    Record<string, { homework: string; feedback: string; visible: boolean; saving?: boolean }>
  >({});

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getTeacherProfile();
        setProfile(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    }
    fetchProfile();
  }, []);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  const days = [];
  // Previous month filler
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ day: "", type: "empty" });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, type: "current", date: new Date(year, month, i) });
  }

  const WEEK_START_HOUR = 7;
  const WEEK_END_HOUR = 22;
  const SLOT_INTERVAL_MIN = 30;
  const SLOT_HEIGHT = 36;

  const toDateString = (date: Date) => date.toISOString().split("T")[0];

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0-6, Sunday=0
    const diff = (day + 6) % 7; // Monday=0
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const addDays = (date: Date, daysToAdd: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + daysToAdd);
    return d;
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map((v) => parseInt(v, 10));
    return h * 60 + (m || 0);
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const weekStart = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, idx) => addDays(weekStart, idx));
  const weekEnd = addDays(weekStart, 6);

  // Fetch bookings when date range changes
  async function refreshBookings(startDate: Date, endDate: Date) {
    setLoading(true);
    try {
      const [data, pendingData] = await Promise.all([
        getTeacherBookings(startDate, endDate),
        getTeacherPendingBookings()
      ]);

      setBookings(data);
      setPendingBookings(pendingData);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  const refreshBookingsForCurrentView = () => {
    if (viewMode === "month") {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      refreshBookings(start, end);
    } else {
      refreshBookings(weekStart, weekEnd);
    }
  };

  useEffect(() => {
    refreshBookingsForCurrentView();
  }, [year, month, viewMode, currentDate.getTime()]);

  useEffect(() => {
    if (!bookings.length) return;
    setFeedbackDrafts((prev) => {
      const next = { ...prev };
      bookings.forEach((booking) => {
        if (!next[booking.id]) {
          next[booking.id] = {
            homework: booking.homework || "",
            feedback: booking.teacherFeedback || "",
            visible: booking.teacherFeedbackVisible ?? true,
          };
        }
      });
      return next;
    });
  }, [bookings]);

  useEffect(() => {
    async function fetchAvailability() {
      if (!profile || viewMode !== "week") return;
      try {
        const data = await getTeacherAvailability(
          profile.id,
          toDateString(weekStart),
          toDateString(weekEnd)
        );
        setAvailability(data);
      } catch (error) {
        console.error("Failed to fetch availability:", error);
      }
    }
    fetchAvailability();
  }, [profile, viewMode, currentDate.getTime()]);

  // Group bookings by day
  const events = useMemo(() => {
    const grouped: { [key: number]: any[] } = {};
    bookings.forEach((booking) => {
      const date = new Date(booking.bookingDate);
      const day = date.getDate();
      if (!grouped[day]) grouped[day] = [];

      // Determine color based on course type or status (mock logic for color for now, or random)
      // Using status for simplicity: confirmed -> emerald, pending -> orange
      let color = "slate";
      if (booking.status === "confirmed") color = "emerald";
      else if (booking.status === "pending") color = "orange";
      else if (booking.status === "cancelled") color = "red";

      // Check for pending reschedule
      const hasPendingReschedule = (booking as any).rescheduleRequests?.some((r: any) => r.status === 'pending');

      grouped[day].push({
        time: booking.startTime.substring(0, 5), // HH:mm
        name: booking.studentName || "Unknown",
        color: color,
        status: booking.status,
        duration: 60, // approximate, or calculate from start/end
        courseTitle: booking.courseTitle,
        email: booking.studentEmail,
        id: booking.id,
        hasPendingReschedule // Add this flag
      });
    });
    return grouped;
  }, [bookings]);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handlePrevWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };

  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const weekBookings = useMemo(() => {
    const startStr = toDateString(weekStart);
    const endStr = toDateString(weekEnd);
    return bookings.filter(
      (b) => b.bookingDate >= startStr && b.bookingDate <= endStr
    );
  }, [bookings, weekStart.getTime(), weekEnd.getTime()]);

  const handleSaveFeedback = async (bookingId: string) => {
    const draft = feedbackDrafts[bookingId];
    if (!draft) return;
    setFeedbackDrafts((prev) => ({
      ...prev,
      [bookingId]: { ...draft, saving: true },
    }));
    try {
      await updateBookingFeedback(bookingId, {
        homework: draft.homework.trim() || null,
        teacherFeedback: draft.feedback.trim() || null,
        teacherFeedbackVisible: draft.visible,
      });
      showModal({
        type: "success",
        title: "已儲存課後回饋",
        description: "回家作業與評語已更新。",
        confirmText: "確定",
      });
      refreshBookingsForCurrentView();
    } catch (error: any) {
      showModal({
        type: "error",
        title: "儲存失敗",
        description: error?.message || "請稍後再試。",
        confirmText: "確定",
      });
    } finally {
      setFeedbackDrafts((prev) => ({
        ...prev,
        [bookingId]: { ...draft, saving: false },
      }));
    }
  };

  const availabilityMap = useMemo(() => {
    const map: Record<string, { slots: { start: string; end: string }[]; isUnavailable: boolean }> = {};
    availability.forEach((item) => {
      map[item.date] = { slots: item.slots, isUnavailable: item.isUnavailable };
    });
    return map;
  }, [availability]);

  const getDayBookings = (date: Date) => {
    const dateStr = toDateString(date);
    return weekBookings.filter((booking) => booking.bookingDate === dateStr);
  };

  const minutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const subtractIntervals = (
    availabilitySlots: { start: string; end: string }[],
    bookingSlots: { start: string; end: string }[]
  ) => {
    const result: { start: string; end: string }[] = [];
    const sortedBookings = bookingSlots
      .map((slot) => ({
        start: timeToMinutes(slot.start),
        end: timeToMinutes(slot.end),
      }))
      .sort((a, b) => a.start - b.start);

    availabilitySlots.forEach((slot) => {
      const start = timeToMinutes(slot.start);
      const end = timeToMinutes(slot.end);
      let cursor = start;

      sortedBookings.forEach((b) => {
        if (b.end <= cursor || b.start >= end) return;
        if (b.start > cursor) {
          result.push({
            start: minutesToTime(cursor),
            end: minutesToTime(b.start),
          });
        }
        cursor = Math.max(cursor, b.end);
      });

      if (cursor < end) {
        result.push({
          start: minutesToTime(cursor),
          end: minutesToTime(end),
        });
      }
    });

    return result;
  };

  const timeSlots = Array.from(
    { length: ((WEEK_END_HOUR - WEEK_START_HOUR) * 60) / SLOT_INTERVAL_MIN + 1 },
    (_, idx) => WEEK_START_HOUR * 60 + idx * SLOT_INTERVAL_MIN
  );

  return (
    <div className="flex flex-col min-h-full xl:h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10 transition-all">
        <div className="flex flex-col">
          <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight flex items-center gap-2">
            預約管理中心
          </h2>
          <p className="text-text-sub dark:text-gray-400 text-sm mt-0.5">
            管理您的教學日程，確認學生預約與付款狀態
          </p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button className="p-2.5 rounded-full text-text-sub dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700 relative transition-colors flex-shrink-0">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-surface-dark"></span>
          </button>
          <div className="h-8 w-px bg-border-light dark:bg-border-dark mx-1"></div>
          <div className="flex items-center gap-3 px-2 flex-shrink-0">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {profile?.name || "Loading..."} 老師
            </span>
            {profile?.avatarUrl ? (
              <div
                className="w-8 h-8 rounded-full bg-cover bg-center flex-shrink-0"
                style={{
                  backgroundImage: `url("${profile.avatarUrl}")`,
                }}
              ></div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex justify-center items-center font-bold flex-shrink-0">
                {profile?.name?.[0] || "?"}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col xl:overflow-hidden">
        {/* Pending Banner */}
        {pendingBookings.length > 0 && (
          <div className="bg-orange-50 border-b border-orange-100 px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-orange-600">
                pending_actions
              </span>
              <div>
                <p className="text-sm font-bold text-orange-800">
                  您有 {pendingBookings.length} 筆待確認的預約
                </p>
                <p className="text-xs text-orange-600">
                  這些預約可能在其他月份，請盡快審核。
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // For now, perhaps just log or open a dialog?
                // Or maybe we should append these pending bookings to the list temporarily to view them?
                // Let's implement a simple modal or expander to view them later.
                // For MVP, just scrolling to current date isn't enough.
                // We'll trigger the EditBookingDialog for the first one for now as a quick fix or just let the user know.
                if (pendingBookings[0]) {
                  setEditingBooking(pendingBookings[0]);
                }
              }}
              className="px-4 py-2 bg-white border border-orange-200 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-50 transition-colors shadow-sm"
            >
              立即審核 ({pendingBookings.length})
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="px-4 md:px-8 py-6 pb-2">
          <div className="flex flex-col xl:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 flex-1">
              <div className="relative group w-full sm:flex-1 md:max-w-xs">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">
                  search
                </span>
                <input
                  className="pl-10 pr-4 py-2 w-full rounded-xl border border-transparent bg-white dark:bg-surface-dark shadow-sm ring-1 ring-border-light dark:ring-border-dark focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400"
                  placeholder="搜尋學生姓名..."
                  type="text"
                />
              </div>
              <div className="relative group w-full sm:flex-1 md:max-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">
                  calendar_month
                </span>
                <input
                  className="pl-10 pr-4 py-2 w-full rounded-xl border border-transparent bg-white dark:bg-surface-dark shadow-sm ring-1 ring-border-light dark:ring-border-dark focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  type="date"
                  value={selectedDate.toISOString().split("T")[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      const newDate = new Date(e.target.value);
                      setSelectedDate(newDate);
                      setCurrentDate(newDate);
                    }
                  }}
                />
              </div>
              <div className="relative w-full sm:flex-1 md:max-w-[180px]">
                <select className="pl-3 pr-8 py-2 w-full rounded-xl border border-transparent bg-white dark:bg-surface-dark shadow-sm ring-1 ring-border-light dark:ring-border-dark focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm text-slate-700 dark:text-slate-200 transition-all cursor-pointer appearance-none">
                  <option value="">所有付款狀態</option>
                  <option value="unpaid">待付款</option>
                  <option value="paid">已付款</option>
                  <option value="noshow">未出席</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2 text-slate-400 pointer-events-none text-[20px]">
                  expand_more
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
              <div className="flex bg-white dark:bg-surface-dark rounded-lg p-1 shadow-sm ring-1 ring-border-light dark:ring-border-dark">
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors flex items-center gap-1 ${viewMode === "month"
                    ? "bg-primary/10 text-primary-dark dark:text-primary"
                    : "text-text-sub hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400"
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_view_month
                  </span>
                  月視圖
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors flex items-center gap-1 ${viewMode === "week"
                    ? "bg-primary/10 text-primary-dark dark:text-primary"
                    : "text-text-sub hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-400"
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_view_week
                  </span>
                  週視圖
                </button>
              </div>
              <Link
                href="/teacher/availability"
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-200 font-medium border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">
                  calendar_clock
                </span>
                <span className="text-sm min-w-max">設定預約時間</span>
              </Link>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium shadow-lg shadow-primary/20 transition-all active:scale-95 group"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">
                  add
                </span>
                <span className="text-sm min-w-max">新增預約</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col xl:flex-row gap-6 p-4 md:p-8 pt-4 xl:overflow-hidden">
          {/* Calendar Grid */}
          {viewMode === "month" ? (
            <div className="flex-1 min-h-[500px] xl:min-h-0 bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {year}年 {month + 1}月
                    <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 ml-2">
                      {bookings.length} 筆預約
                    </span>
                  </h2>
                  <div className="flex items-center rounded-lg border border-border-light dark:border-border-dark p-0.5 bg-slate-50 dark:bg-slate-800">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 rounded hover:bg-white dark:hover:bg-surface-dark text-slate-500 hover:shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        chevron_left
                      </span>
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 rounded hover:bg-white dark:hover:bg-surface-dark text-slate-500 hover:shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleToday}
                  className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors"
                >
                  回到今天
                </button>
              </div>

              {/* Weekday Header */}
              <div className="grid grid-cols-7 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
                {["週日", "週一", "週二", "週三", "週四", "週五", "週六"].map(
                  (d) => (
                    <div
                      key={d}
                      className="py-3 text-center text-xs font-bold text-text-sub uppercase tracking-wider"
                    >
                      {d}
                    </div>
                  )
                )}
              </div>

              {/* Days */}
              <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto bg-slate-50/20 dark:bg-slate-900/20">
                {loading ? (
                  <div className="col-span-7 row-span-5 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  days.map((d, index) => {
                    if (d.type === "empty") {
                      return (
                        <div
                          key={index}
                          className="border-b border-r border-border-light dark:border-border-dark p-2 min-h-[100px] bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group"
                        ></div>
                      );
                    }

                    // @ts-ignore
                    const dayEvents = events[d.day] || [];
                    // @ts-ignore
                    const isSelected = isSameDay(d.date, selectedDate);

                    return (
                      <div
                        key={index}
                        onClick={() => {
                          // @ts-ignore
                          setSelectedDate(d.date);
                        }}
                        className={`
                                    border-b border-r border-border-light dark:border-border-dark p-2 min-h-[100px] 
                                    transition-colors cursor-pointer group relative
                                    ${isSelected
                            ? "bg-blue-50/40 dark:bg-primary/5 hover:bg-blue-50/60 dark:hover:bg-primary/10 ring-1 ring-inset ring-primary/30 z-10"
                            : "bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-800/30"
                          }
                                `}
                      >
                        <span
                          className={`
                                    flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold 
                                    ${isSelected
                              ? "bg-primary text-white shadow-sm"
                              : "text-slate-700 dark:text-slate-300"
                            }
                                `}
                        >
                          {d.day}
                        </span>
                        <div className="mt-2 flex flex-col gap-1">
                          {dayEvents.map((ev: any, evIdx: number) => (
                            <div
                              key={evIdx}
                              className={`
                                            px-2 py-1 rounded text-[11px] font-medium truncate shadow-sm
                                            ${ev.color === "red"
                                  ? "bg-red-100 text-red-700 border border-red-200 opacity-70"
                                  : ev.color === "orange"
                                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                                    : ev.color === "emerald"
                                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                                }
                                        `}
                            >
                              {ev.time} {ev.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[600px] xl:min-h-0 bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    本週：{weekStart.getMonth() + 1}/{weekStart.getDate()} -
                    {weekEnd.getMonth() + 1}/{weekEnd.getDate()}
                    <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 ml-2">
                      {weekBookings.length} 筆預約
                    </span>
                  </h2>
                  <div className="flex items-center rounded-lg border border-border-light dark:border-border-dark p-0.5 bg-slate-50 dark:bg-slate-800">
                    <button
                      onClick={handlePrevWeek}
                      className="p-1 rounded hover:bg-white dark:hover:bg-surface-dark text-slate-500 hover:shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        chevron_left
                      </span>
                    </button>
                    <button
                      onClick={handleNextWeek}
                      className="p-1 rounded hover:bg-white dark:hover:bg-surface-dark text-slate-500 hover:shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-300"></span>
                      空檔
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm border border-emerald-400 border-dashed"></span>
                      可預約時段
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                      已預約
                    </span>
                  </div>
                  <button
                    onClick={handleToday}
                    className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    回到今天
                  </button>
                </div>
              </div>

              {/* Week Header */}
              <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
                <div className="py-3 text-center text-xs font-bold text-text-sub uppercase tracking-wider">
                  時間
                </div>
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`py-3 text-center text-xs font-bold tracking-wider transition-colors ${isSelected
                        ? "bg-primary/10 text-primary"
                        : isToday
                          ? "text-slate-900 dark:text-white"
                          : "text-text-sub"
                        }`}
                    >
                      <div>{["週一", "週二", "週三", "週四", "週五", "週六", "週日"][day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                      <div className="text-[11px] font-medium text-slate-500">
                        {day.getMonth() + 1}/{day.getDate()}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
                  {/* Time Column */}
                  <div className="border-r border-border-light dark:border-border-dark bg-slate-50/30 dark:bg-slate-800/30">
                    {timeSlots.map((minutes, idx) => {
                      const isHour = minutes % 60 === 0;
                      return (
                        <div
                          key={idx}
                          className="border-b border-border-light dark:border-border-dark flex items-start justify-center text-[10px] text-slate-400"
                          style={{ height: SLOT_HEIGHT }}
                        >
                          {isHour ? (
                            <span className="mt-1">
                              {String(Math.floor(minutes / 60)).padStart(2, "0")}:00
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {weekDays.map((day) => {
                    const dateStr = toDateString(day);
                    const dayAvailability = availabilityMap[dateStr];
                    const dayBookings = getDayBookings(day);
                    const bookingSlots = dayBookings.map((b) => ({
                      start: b.startTime.slice(0, 5),
                      end: b.endTime.slice(0, 5),
                    }));
                    const freeSlots = dayAvailability?.slots
                      ? subtractIntervals(dayAvailability.slots, bookingSlots)
                      : [];
                    const dayHeight = timeSlots.length * SLOT_HEIGHT;

                    return (
                      <div
                        key={dateStr}
                        className="relative border-r border-border-light dark:border-border-dark bg-white dark:bg-surface-dark"
                        style={{ height: dayHeight }}
                      >
                        {/* Grid Lines */}
                        <div className="absolute inset-0">
                          {timeSlots.map((_, idx) => (
                            <div
                              key={idx}
                              className="border-b border-border-light dark:border-border-dark"
                              style={{ height: SLOT_HEIGHT }}
                            ></div>
                          ))}
                        </div>

                        {dayAvailability?.isUnavailable && (
                          <div className="absolute inset-0 bg-slate-100/70 dark:bg-slate-800/50 flex items-center justify-center z-10">
                            <span className="text-xs font-bold text-slate-500">
                              休假
                            </span>
                          </div>
                        )}

                        {/* Availability Outline */}
                        {!dayAvailability?.isUnavailable &&
                          (dayAvailability?.slots || []).map((slot, idx) => {
                            const startMin = clamp(
                              timeToMinutes(slot.start),
                              WEEK_START_HOUR * 60,
                              WEEK_END_HOUR * 60
                            );
                            const endMin = clamp(
                              timeToMinutes(slot.end),
                              WEEK_START_HOUR * 60,
                              WEEK_END_HOUR * 60
                            );
                            if (endMin <= startMin) return null;
                            const top =
                              ((startMin - WEEK_START_HOUR * 60) / SLOT_INTERVAL_MIN) *
                              SLOT_HEIGHT;
                            const height =
                              ((endMin - startMin) / SLOT_INTERVAL_MIN) *
                              SLOT_HEIGHT;
                            return (
                              <div
                                key={idx}
                                className="absolute left-2 right-2 border border-emerald-400 border-dashed rounded-lg z-10"
                                style={{ top, height }}
                              ></div>
                            );
                          })}

                        {/* Free Slots */}
                        {!dayAvailability?.isUnavailable &&
                          freeSlots.map((slot, idx) => {
                            const startMin = clamp(
                              timeToMinutes(slot.start),
                              WEEK_START_HOUR * 60,
                              WEEK_END_HOUR * 60
                            );
                            const endMin = clamp(
                              timeToMinutes(slot.end),
                              WEEK_START_HOUR * 60,
                              WEEK_END_HOUR * 60
                            );
                            if (endMin <= startMin) return null;
                            const top =
                              ((startMin - WEEK_START_HOUR * 60) / SLOT_INTERVAL_MIN) *
                              SLOT_HEIGHT;
                            const height =
                              ((endMin - startMin) / SLOT_INTERVAL_MIN) *
                              SLOT_HEIGHT;
                            return (
                              <div
                                key={idx}
                                className="absolute left-3 right-3 bg-emerald-200/70 text-emerald-700 text-[10px] font-bold rounded-md px-2 py-1 z-20"
                                style={{ top: top + 2, height: height - 4 }}
                              >
                                可預約
                              </div>
                            );
                          })}

                        {/* Bookings */}
                        {dayBookings.map((booking, idx) => {
                          const startMin = clamp(
                            timeToMinutes(booking.startTime),
                            WEEK_START_HOUR * 60,
                            WEEK_END_HOUR * 60
                          );
                          const endMin = clamp(
                            timeToMinutes(booking.endTime),
                            WEEK_START_HOUR * 60,
                            WEEK_END_HOUR * 60
                          );
                          if (endMin <= startMin) return null;
                          const top =
                            ((startMin - WEEK_START_HOUR * 60) / SLOT_INTERVAL_MIN) *
                            SLOT_HEIGHT;
                          const height =
                            ((endMin - startMin) / SLOT_INTERVAL_MIN) *
                            SLOT_HEIGHT;
                          const statusColor =
                            booking.status === "confirmed"
                              ? "bg-blue-500"
                              : booking.status === "pending"
                                ? "bg-orange-500"
                                : "bg-slate-500";
                          return (
                            <div
                              key={idx}
                              className={`absolute left-3 right-3 ${statusColor} text-white text-[10px] font-bold rounded-lg px-2 py-1 shadow-md z-30`}
                              style={{ top: top + 2, height: height - 4 }}
                            >
                              <div className="flex items-center justify-between">
                                <span>
                                  {booking.startTime.slice(0, 5)}-
                                  {booking.endTime.slice(0, 5)}
                                </span>
                                <span className="opacity-90">
                                  {booking.studentName?.[0] || "學"}
                                </span>
                              </div>
                              <div className="truncate">{booking.studentName}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Schedule */}
          <div className="w-full xl:w-[360px] flex-shrink-0 flex flex-col gap-5 xl:h-full">
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card flex flex-col h-auto xl:h-full overflow-hidden">
              <div className="p-5 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}
                    月{selectedDate.getDate()}日
                  </h3>
                  <p className="text-xs text-text-sub mt-0.5">
                    {/* @ts-ignore */}
                    今日共有 {events[selectedDate.getDate()]?.length || 0}{" "}
                    筆預約
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-bold">
                  {
                    ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][
                    selectedDate.getDay()
                    ]
                  }
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Selected Date Appointments */}
                {/* @ts-ignore */}
                {events[selectedDate.getDate()] ? (
                  // @ts-ignore
                  events[selectedDate.getDate()].map((ev, idx) => {
                    const booking = bookings.find((b) => b.id === ev.id);
                    const draft = booking ? feedbackDrafts[booking.id] : undefined;
                    return (
                      <div key={idx} className="group relative">
                        <div className="absolute -left-5 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm transition-all hover:shadow-md hover:border-primary/40">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-1.5 text-primary">
                              <span className="material-symbols-outlined text-[16px]">
                                schedule
                              </span>
                              <span className="text-xs font-bold tracking-wide">
                                {ev.time}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${ev.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : ev.status === "pending"
                                  ? "bg-orange-100 text-orange-700 border-orange-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                            >
                              {ev.status === "confirmed"
                                ? "已確認"
                                : ev.status === "pending"
                                  ? "待確認"
                                  : ev.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                            {ev.courseTitle || "課程"}
                          </h4>
                          <div className="flex items-center gap-2 mt-3">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-surface-dark">
                              {ev.name[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {ev.name}
                              </span>
                              <span className="text-[10px] text-text-sub">
                                {ev.email}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-dashed border-primary/20 flex gap-2">
                            <button className="flex-1 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-transparent hover:border-border-light dark:hover:border-border-dark transition-all shadow-sm">
                              查看詳情
                            </button>

                            {/* @ts-ignore */}
                            {ev.hasPendingReschedule ? (
                              <button
                                onClick={() => {
                                  const booking = bookings.find((b) => b.id === ev.id);
                                  if (booking) {
                                    // Find the pending request
                                    const request = booking.rescheduleRequests?.find(r => r.status === 'pending');
                                    if (request) {
                                      // We need to pass the request ID to the dialog.
                                      // But the dialog takes `booking` and assumes we want to edit it?
                                      // No, ReviewRescheduleDialog takes `booking`, `requestId`, `newDate`...
                                      // Wait, ReviewRescheduleDialog props are: { open, onOpenChange, booking, request, onSuccess }
                                      // I need to check ReviewRescheduleDialog props.
                                      // For now, I'll set the reviewingBooking and handle the rest in the dialog component area.
                                      setReviewingBooking(booking);
                                    }
                                  }
                                }}
                                className="flex-1 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">update</span>
                                審核改期
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  // Find the original booking object
                                  const booking = bookings.find(
                                    (b) => b.id === ev.id
                                  );
                                  if (booking) setEditingBooking(booking);
                                }}
                                className="flex-1 py-1.5 text-xs font-medium text-primary dark:text-primary hover:bg-primary hover:text-white rounded-lg bg-white/50 dark:bg-slate-800/50 border border-transparent hover:border-primary transition-all shadow-sm"
                              >
                                編輯預約
                              </button>
                            )}
                          </div>

                          {booking && draft && (
                            <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-700/60 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  課後回饋
                                </h5>
                                <label className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <input
                                    type="checkbox"
                                    checked={draft.visible}
                                    onChange={(e) =>
                                      setFeedbackDrafts((prev) => ({
                                        ...prev,
                                        [booking.id]: {
                                          ...draft,
                                          visible: e.target.checked,
                                        },
                                      }))
                                    }
                                    className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600"
                                  />
                                  對學生公開
                                </label>
                              </div>
                              <div className="space-y-2">
                                <textarea
                                  value={draft.homework}
                                  onChange={(e) =>
                                    setFeedbackDrafts((prev) => ({
                                      ...prev,
                                      [booking.id]: {
                                        ...draft,
                                        homework: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="回家作業（可留空）"
                                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                  rows={2}
                                />
                                <textarea
                                  value={draft.feedback}
                                  onChange={(e) =>
                                    setFeedbackDrafts((prev) => ({
                                      ...prev,
                                      [booking.id]: {
                                        ...draft,
                                        feedback: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="教師評語（可留空）"
                                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                  rows={3}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">
                                  允許修改歷史紀錄
                                </span>
                                <button
                                  onClick={() => handleSaveFeedback(booking.id)}
                                  disabled={draft.saving}
                                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {draft.saving ? "儲存中..." : "儲存回饋"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-text-sub py-10">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                      event_busy
                    </span>
                    <p className="text-sm">今日無預約</p>
                  </div>
                )}

                <div className="relative py-2">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center"
                  >
                    <div className="w-full border-t border-border-light dark:border-border-dark"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-surface-dark px-3 text-xs font-medium text-text-sub">
                      接下來的行程
                    </span>
                  </div>
                </div>

                {/* Upcoming items could be added here later */}
              </div>

              <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white shadow-lg shadow-primary/20 relative overflow-hidden m-5 mt-0">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                {/* Calculate Revenue */}
                {(() => {
                  const pendingTotal = bookings
                    .filter((b) => b.status === "pending")
                    .reduce((sum, b) => sum + (b.coursePrice || 0), 0);

                  const receivedTotal = bookings
                    .filter(
                      (b) =>
                        b.status === "confirmed" || b.status === "completed"
                    )
                    .reduce((sum, b) => sum + (b.coursePrice || 0), 0);

                  const projectedTotal = pendingTotal + receivedTotal;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <span className="text-xs font-medium text-white/90">
                          本月預估收入 (Projected)
                        </span>
                        <span className="material-symbols-outlined text-[20px] text-white/80">
                          payments
                        </span>
                      </div>
                      <div className="text-2xl font-bold tracking-tight relative z-10">
                        NT$ {projectedTotal.toLocaleString()}
                      </div>

                      <div className="mt-4 flex flex-col gap-1 relative z-10">
                        <div className="flex justify-between items-center text-xs text-white/90">
                          <span>已收款 (Received):</span>
                          <span className="font-bold">
                            NT$ {receivedTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-white/70">
                          <span>待確認 (Pending):</span>
                          <span>NT$ {pendingTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-white/20 relative z-10 flex text-[10px] text-white/80 gap-2">
                        <span>共 {bookings.length} 筆預約</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditBookingDialog
        booking={editingBooking}
        open={!!editingBooking}
        onOpenChange={(open) => {
          if (!open) setEditingBooking(null);
        }}
        onSuccess={refreshBookingsForCurrentView}
      />

      {reviewingBooking && (() => {
        const request = (reviewingBooking as any).rescheduleRequests?.find((r: any) => r.status === 'pending');
        if (!request) return null;
        return (
          <ReviewRescheduleDialog
            open={!!reviewingBooking}
            onOpenChange={(open) => {
              if (!open) setReviewingBooking(null);
            }}
            requestId={request.id}
            currentDate={reviewingBooking.bookingDate}
            currentTime={`${reviewingBooking.startTime.slice(0, 5)} - ${reviewingBooking.endTime.slice(0, 5)}`}
            newDate={new Date(request.newStartTime).toLocaleDateString()}
            newTime={new Date(request.newStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            reason={request.reason}
            requestedBy={reviewingBooking.studentName || "學生"}
            onSuccess={() => {
              setReviewingBooking(null);
              refreshBookingsForCurrentView();
            }}
          />
        );
      })()}

      {profile && (
        <CreateBookingDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={refreshBookingsForCurrentView}
          teacherId={profile.id}
        />
      )}
    </div>
  );
}
