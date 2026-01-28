"use client";

import { useEffect, useState, useMemo } from "react";
import { useModal } from "@/components/providers/ModalContext";
import { zhTW } from "date-fns/locale";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameDay as dateFnsIsSameDay,
} from "date-fns";
import {
  getTeacherAvailability,
  saveOverrides,
  getWeeklySettings,
  saveWeeklyAvailability,
} from "./actions";
import { getTeacherProfile } from "@/app/actions/teacher";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TeacherProfile } from "@/lib/domain/teacher/entity";
import {
  AvailabilityIntervalList,
  TimeRange,
} from "@/components/teacher/availability/AvailabilityIntervalList";
import { cn } from "@/lib/utils";
import Link from "next/link"; // Added Link import

export default function AvailabilityPage() {
  const { showModal } = useModal();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  // Weekly Settings State
  const [weeklySettingsOpen, setWeeklySettingsOpen] = useState(false);
  const [weeklySlots, setWeeklySlots] = useState<Record<number, TimeRange[]>>(
    {}
  );
  const [weeklyEnabled, setWeeklyEnabled] = useState<Record<number, boolean>>(
    {}
  );
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState<number>(1);

  // Override State
  // For the new UI, we treat the standard "Save" flow as saving overrides for the selected day.
  const [selectedDayOverride, setSelectedDayOverride] = useState<{
    date: string;
    isUnavailable: boolean;
    slots: TimeRange[];
  } | null>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: teacher } = await supabase
          .from("teacher_info")
          .select("id")
          .eq("id", user.id)
          .single();
        if (teacher) setTeacherId(teacher.id);

        try {
          const profileData = await getTeacherProfile();
          setProfile(profileData);
        } catch (error) {
          console.error("Failed to fetch profile", error);
        }
      }
    };
    fetchUserAndProfile();
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    const fetchAvailability = async () => {
      setLoading(true);
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
      const data = await getTeacherAvailability(teacherId, start, end);
      setAvailability(data);
      setLoading(false);
    };
    fetchAvailability();
  }, [teacherId, currentDate]); // Remove overly frequent deps

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const dateStr = format(day, "yyyy-MM-dd");
    const existing = availability.find((a) => a.date === dateStr);

    // Set state for the "Step 2" section
    setSelectedDayOverride({
      date: dateStr,
      isUnavailable: existing ? existing.isUnavailable : false,
      slots:
        existing?.slots?.map((s: any) => ({ start: s.start, end: s.end })) ||
        [],
    });
  };

  const handleSaveCurrentDay = async () => {
    if (!teacherId || !selectedDayOverride) return;

    // Logic Fix: If user selects NO slots and does NOT check "Unavailable",
    // we should treat it as "Unavailable" (Closed for the day),
    // otherwise the system saves 0 overrides, causing it to fall back to Weekly settings.
    const effectiveIsUnavailable =
      selectedDayOverride.isUnavailable ||
      selectedDayOverride.slots.length === 0;

    if (effectiveIsUnavailable) {
      const result = await saveOverrides(teacherId, selectedDayOverride.date, [
        {
          teacherId,
          date: selectedDayOverride.date,
          startTime: null,
          endTime: null,
          isUnavailable: true,
        },
      ]);
      if (!result.success) {
        showModal({ type: "error", title: "儲存失敗", description: result.error, confirmText: "確定" });
        return;
      }
    } else {
      const overrides = selectedDayOverride.slots.map((slot) => ({
        teacherId,
        date: selectedDayOverride.date,
        startTime: slot.start,
        endTime: slot.end,
        isUnavailable: false,
      }));
      const result = await saveOverrides(
        teacherId,
        selectedDayOverride.date,
        overrides
      );
      if (!result.success) {
        showModal({ type: "error", title: "儲存失敗", description: result.error, confirmText: "確定" });
        return;
      }
    }

    showModal({ type: "success", title: "設定已儲存", description: "預約時段設定已成功更新", confirmText: "確定" });

    // Refresh
    const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
    const data = await getTeacherAvailability(teacherId, start, end);
    setAvailability(data);
  };

  // Weekly Logic helpers (same as before)
  const openWeeklySettings = async () => {
    if (!teacherId) return;
    const data = await getWeeklySettings(teacherId);
    const newSlots: Record<number, TimeRange[]> = {};
    const newEnabled: Record<number, boolean> = {};
    for (let i = 0; i < 7; i++) {
      newSlots[i] = [];
      newEnabled[i] = false;
    }
    data.forEach((item: any) => {
      const d = item.dayOfWeek;
      newEnabled[d] = true;
      newSlots[d].push({ start: item.startTime, end: item.endTime });
    });
    setWeeklySlots(newSlots);
    setWeeklyEnabled(newEnabled);
    setWeeklySettingsOpen(true);
  };

  const handleSaveWeekly = async () => {
    if (!teacherId) return;
    const toSave: any[] = [];
    Object.keys(weeklyEnabled).forEach((key) => {
      const day = Number(key);
      if (weeklyEnabled[day]) {
        const slots = weeklySlots[day];
        slots.forEach((slot) => {
          toSave.push({
            teacherId,
            dayOfWeek: day,
            startTime: slot.start,
            endTime: slot.end,
          });
        });
      }
    });
    await saveWeeklyAvailability(teacherId, toSave);
    setWeeklySettingsOpen(false);
  };

  // Calendar Grid Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday

  type CalendarDay =
    | { day: number; type: "empty"; date?: undefined }
    | { day: number; type: "current"; date: Date };

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const days: CalendarDay[] = [];
    // Previous month filler
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: 0, type: "empty" });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, type: "current", date: new Date(year, month, i) });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOfMonth]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return dateFnsIsSameDay(d1, d2);
  };

  const getDayStatus = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const status = availability.find((a) => a.date === dateStr);
    return status;
  };

  const DAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

  return (
    <div className="min-h-screen w-full bg-background-light dark:bg-background-dark p-6 md:p-10 pb-24 font-body text-text-main dark:text-slate-100">
      {/* Header Area */}
      <div className="container mx-auto max-w-6xl mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
              <span className="opacity-70">教師後台</span>
              <span className="material-symbols-outlined text-[14px]">
                chevron_right
              </span>
              <span className="text-slate-800 dark:text-white">預約管理</span>
            </div>
            <h1 className="text-slate-900 dark:text-white text-3xl font-display font-black leading-tight tracking-tight">
              預約時間管理
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
              設定您的課程開放時段。您可以設定每週固定規則，或針對特定日期進行調整。
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/teacher/bookings"
              className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">
                calendar_month
              </span>
              <span>查看預約紀錄</span>
            </Link>
            <Button
              onClick={openWeeklySettings}
              className="bg-primary hover:bg-primary-dark text-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-glow shadow-primary/20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">
                calendar_view_week
              </span>
              <span>設定每週規則</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Info Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border-l-4 border-l-amber-500 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col sm:flex-row gap-5 items-start relative">
            <div className="flex-1">
              <h3 className="font-bold text-xs text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  info
                </span>
                操作提示
              </h3>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>1. 點擊日曆選擇日期。</p>
                <p>
                  2.
                  在下方設定該日的開放時段。若未設定例外，將自動套用每週規則。
                </p>
              </div>
            </div>
          </div>

          {/* Timeline / Steps Container */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden animate-slide-up">
            {/* Step 1: Select Date - Manual Grid Implementation */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10 bg-surface-light dark:bg-surface-dark">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <span className="flex items-center justify-center size-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-lg font-bold shadow-md">
                  1
                </span>
                選擇日期
              </h2>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {year}年 {month + 1}月
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
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="py-3 text-center text-xs font-bold text-text-sub uppercase tracking-wider"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-y-4 gap-x-2 sm:gap-4">
                {loading ? (
                  <div className="col-span-7 h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  calendarDays.map((d, index) => {
                    if (d.type === "empty" || d.date === undefined) {
                      return (
                        <div
                          key={`empty-${index}`}
                          className="aspect-square"
                        ></div>
                      );
                    }

                    const dateObj: Date = d.date;
                    const isSelected = isSameDay(dateObj, selectedDate);
                    const status = getDayStatus(dateObj);
                    const isUnavailable = status?.isUnavailable;
                    const hasSlots = status?.slots && status.slots.length > 0;

                    return (
                      <button
                        key={`day-${d.day}`}
                        onClick={() => handleDayClick(dateObj)}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all group",
                          isSelected
                            ? "bg-primary text-white shadow-glow ring-4 ring-primary/20 scale-105 z-10"
                            : "hover:bg-primary/10 hover:text-primary hover:scale-105 text-slate-600 dark:text-slate-400 bg-transparent",
                          isUnavailable &&
                          !isSelected &&
                          "opacity-50 line-through text-red-400 decoration-red-400",
                          hasSlots &&
                          !isSelected &&
                          "font-bold text-slate-800 dark:text-white"
                        )}
                      >
                        <span className="text-sm font-medium">{d.day}</span>
                        {/* Indicator Dots */}
                        <div className="flex gap-0.5 mt-1 h-1.5">
                          {hasSlots && (
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-white" : "bg-primary"
                              )}
                            ></span>
                          )}
                          {isUnavailable && isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-300"></span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Set Availability */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden relative">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 relative z-10 bg-surface-light dark:bg-surface-dark">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <span className="flex items-center justify-center size-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-lg font-bold shadow-md">
                  2
                </span>
                設定時段 (
                {selectedDate ? format(selectedDate, "MM月dd日") : "未選擇"})
              </h2>
            </div>
            <div className="p-6 relative z-10 bg-surface-light dark:bg-surface-dark">
              {selectedDayOverride ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border-light dark:border-border-dark">
                    <Checkbox
                      id="unavailable"
                      checked={selectedDayOverride.isUnavailable}
                      onCheckedChange={(checked) =>
                        setSelectedDayOverride((prev) =>
                          prev
                            ? { ...prev, isUnavailable: checked === true }
                            : null
                        )
                      }
                      className="border-slate-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor="unavailable"
                      className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      設為全天不可預約 (休息/請假)
                    </Label>
                  </div>

                  {!selectedDayOverride.isUnavailable && (
                    <AvailabilityIntervalList
                      value={selectedDayOverride.slots}
                      onChange={(slots) =>
                        setSelectedDayOverride((prev) =>
                          prev ? { ...prev, slots } : null
                        )
                      }
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  請先選擇日期
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Preview */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 z-20">
            <div className="bg-surface-light dark:bg-surface-dark rounded-3xl border border-slate-200 dark:border-slate-800 shadow-floating overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-primary-dark w-full"></div>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    設定預覽
                  </h2>
                  <span className="bg-primary/10 text-primary-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wide">
                    Preview
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  確認您對該日期的更改。
                </p>
              </div>

              <div className="p-6 flex flex-col gap-6">
                {selectedDayOverride ? (
                  <>
                    <div className="space-y-5 relative">
                      <div className="flex gap-4 items-start relative">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark border-2 border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm z-10">
                          <span className="material-symbols-outlined text-[20px]">
                            calendar_today
                          </span>
                        </div>
                        <div className="pt-1 w-full">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            日期 Date
                          </p>
                          <p className="text-slate-800 dark:text-white font-bold text-base">
                            {format(
                              new Date(selectedDayOverride.date),
                              "yyyy年 M月 d日 (EEEE)",
                              { locale: zhTW }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start relative">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark border-2 border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-sm z-10">
                          <span className="material-symbols-outlined text-[20px]">
                            schedule
                          </span>
                        </div>
                        <div className="pt-1 w-full">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                            開放時段 Slots
                          </p>
                          {selectedDayOverride.isUnavailable ? (
                            <span className="inline-block bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-bold">
                              不可預約
                            </span>
                          ) : selectedDayOverride.slots.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedDayOverride.slots.map((s, i) => (
                                <span
                                  key={i}
                                  className="inline-block bg-primary/10 text-primary-dark text-xs px-2 py-1 rounded font-medium"
                                >
                                  {s.start}-{s.end}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm italic">
                              無設定時段 (依每週規則或不開放)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-3">
                      <button
                        onClick={handleSaveCurrentDay}
                        className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-primary dark:hover:bg-primary-dark text-white dark:text-slate-900 font-bold py-3.5 rounded-xl shadow-lg shadow-slate-300/50 dark:shadow-glow transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98]"
                      >
                        <span>儲存此日設定</span>
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    請在左側選擇日期以預覽設定
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Settings Dialog (Reused Logic, Styled Content) */}
      <Dialog open={weeklySettingsOpen} onOpenChange={setWeeklySettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-surface-dark border-border-light dark:border-border-dark flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 border-b border-border-light dark:border-border-dark">
            <DialogTitle className="text-slate-800 dark:text-white text-xl font-bold">
              每週固定時間表
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden h-[600px]">
            {/* Sidebar Days */}
            <div className="w-56 border-r border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-900/50 flex flex-col overflow-y-auto py-2">
              {DAYS.map((dayName, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedWeeklyDay(idx)}
                  className={cn(
                    "w-full text-left px-6 py-4 text-sm font-medium transition-all flex items-center justify-between border-l-4",
                    selectedWeeklyDay === idx
                      ? "bg-white dark:bg-surface-dark text-primary border-l-primary shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-l-transparent"
                  )}
                >
                  <span>{dayName}</span>
                  {weeklyEnabled[idx] && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow" />
                  )}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto bg-surface-light dark:bg-surface-dark">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {DAYS[selectedWeeklyDay]}
                  <span className="text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    Weekly Rule
                  </span>
                </h3>
                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-border-light dark:border-border-dark">
                  <Checkbox
                    id="day-enabled"
                    checked={weeklyEnabled[selectedWeeklyDay]}
                    onCheckedChange={(c) => {
                      setWeeklyEnabled((prev) => ({
                        ...prev,
                        [selectedWeeklyDay]: c === true,
                      }));
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="day-enabled"
                    className="cursor-pointer font-bold text-slate-700 dark:text-slate-200"
                  >
                    啟用此日排程
                  </Label>
                </div>
              </div>

              {weeklyEnabled[selectedWeeklyDay] ? (
                <div className="animate-fade-in">
                  <AvailabilityIntervalList
                    value={weeklySlots[selectedWeeklyDay]}
                    onChange={(slots) =>
                      setWeeklySlots((prev) => ({
                        ...prev,
                        [selectedWeeklyDay]: slots,
                      }))
                    }
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <span className="material-symbols-outlined text-5xl mb-4 opacity-50">
                    block
                  </span>
                  <p className="text-lg font-medium">此日設定為休息日</p>
                  <p className="text-sm opacity-70">學生將無法預約此日的時段</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setWeeklySettingsOpen(false)}
              className="rounded-xl h-11"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveWeekly}
              className="bg-primary hover:bg-primary-dark text-white rounded-xl px-8 h-11 font-bold shadow-glow"
            >
              儲存全部設定
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
