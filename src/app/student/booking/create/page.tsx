"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";
import { useStudentCourseDetail } from "../../courses/useStudentTeacherCourses";
import {
  checkBookingConflict,
  createBooking,
  getAvailableSlots,
} from "@/app/actions/booking";
import { AvailabilityIntervalList } from "@/components/shared/AvailabilityIntervalList";
import Select from "@/components/ui/Select";

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper to get first day of month (0 = Sunday)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// Helper to parse "HH:mm" to minutes
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// Helper to format minutes to "HH:mm"
const toTimeStr = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const toDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

const normalizeDateInput = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const match = value.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

type ContiguousBlock = {
  startTime: string;
  endTime: string;
};

const MAX_BOOKING_HOURS = 4;

const clampBookingHours = (value: number) => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(MAX_BOOKING_HOURS, Math.max(1, Math.floor(value)));
};

const BOOKING_HOUR_OPTIONS = Array.from({ length: MAX_BOOKING_HOURS }, (_, index) => {
  const value = index + 1;
  return { value, label: `${value} 小時` };
});

export default function StudentBookingCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showModal } = useModal();
  const courseId = searchParams.get("courseId") || "";
  const hoursParam = clampBookingHours(Number(searchParams.get("hours")));
  const [hours, setHours] = useState(hoursParam);
  const [submitting, setSubmitting] = useState(false);

  // Calendar State
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Booking State
  const [availableSlots, setAvailableSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [selectedBlock, setSelectedBlock] = useState<ContiguousBlock | null>(null);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Slot Request Mode States
  const [isRequestMode, setIsRequestMode] = useState(false);
  const [slotPreferences, setSlotPreferences] = useState<{date: string, start: string, end: string}[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Common Submission State
  const [notes, setNotes] = useState("");

  const { course, context, loading, error } = useStudentCourseDetail(courseId);

  useEffect(() => {
    setHours(hoursParam);
  }, [hoursParam]);

  useEffect(() => {
    setSelectedBlock(null);
    setSlotPreferences([]);
    setRequestError(null);
  }, [hours]);

  useEffect(() => {
    async function fetchSlots() {
      if (selectedDate && context?.teacherId) {
        setIsFetchingSlots(true);
        setSelectedBlock(null);
        try {
          const dateStr = toDateKey(selectedDate);

          const slots = await getAvailableSlots(
            context.teacherId,
            dateStr,
            dateStr,
            30
          );
          setAvailableSlots(slots);
        } catch (error) {
          console.error("Failed to fetch slots", error);
          setAvailableSlots([]);
        } finally {
          setIsFetchingSlots(false);
        }
      } else {
        setAvailableSlots([]);
      }
    }
    fetchSlots();
  }, [selectedDate, context?.teacherId]);

  // Derive Contiguous Blocks for Standard Mode
  const contiguousBlocks = useMemo(() => {
    if (!availableSlots.length || !hours) return [];

    const sorted = [...availableSlots].sort(
      (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
    );
    const blocks: { startTime: string; endTime: string }[] = [];
    const requiredDuration = hours * 60;

    for (const slot of sorted) {
      const startMins = toMinutes(slot.startTime);
      const targetEndMins = startMins + requiredDuration;

      let hasAll = true;
      for (let t = startMins; t < targetEndMins; t += 30) {
        if (!sorted.some((s) => toMinutes(s.startTime) === t)) {
          hasAll = false;
          break;
        }
      }

      if (hasAll) {
        blocks.push({
          startTime: slot.startTime,
          endTime: toTimeStr(targetEndMins),
        });
      }
    }
    return blocks;
  }, [availableSlots, hours]);

  // Calendar calculations
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const monthNames = [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ];
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isPast = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return checkDate < todayStart;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  const handleDayClick = (day: number) => {
    if (isPast(day)) return;
    setSelectedDate(new Date(currentYear, currentMonth, day));
    setSelectedBlock(null);
    setRequestError(null); // Clear request error when changing date
  };

  const formattedSelectedDate = selectedDate
    ? `${selectedDate.getFullYear()}年 ${
        selectedDate.getMonth() + 1
      }月 ${selectedDate.getDate()}日 (${weekDays[selectedDate.getDay()]})`
    : null;
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : null;

  const handleConfirm = async () => {
    if (!course || !context) return;
    if ((!selectedBlock && !isRequestMode) || submitting) return;
    if (isRequestMode && slotPreferences.length !== 3) {
      setRequestError("請提供三個您方便的上課時段。");
      return;
    }
    if (
      isRequestMode &&
      slotPreferences.some(
        (pref) => toMinutes(pref.end) - toMinutes(pref.start) !== hours * 60
      )
    ) {
      setRequestError(`每個申請時段都必須剛好為 ${hours} 小時。`);
      return;
    }

    setSubmitting(true);

    try {
      if (isRequestMode) {
        const formattedPrefs = slotPreferences.map(pref => ({
          date: normalizeDateInput(pref.date),
          startTime: pref.start,
          endTime: pref.end,
        }));

        // Call the createBooking action with request mode specific data
        const result = await createBooking(
          {
            studentId: context.studentId,
            courseId: course.id,
            teacherId: context.teacherId,
            bookingDate: formattedPrefs[0]?.date || "", // Dummy value for type compliance
            startTime: formattedPrefs[0]?.startTime || "",
            endTime: formattedPrefs[0]?.endTime || "",
            notes: notes.trim() || null,
            requestedSlots: formattedPrefs,
          },
          { buyNewPack: false } // Assuming request mode doesn't involve immediate purchase
        );

        if (!result.success) {
          throw new Error(result.error || "時段申請失敗");
        }

        showModal({
          title: "申請已送出",
          description: `已成功送出 ${course.title} 的時段申請，請等待老師確認。`,
          confirmText: "查看預約",
          onConfirm: () => router.push("/student/bookings"),
        });
        return;
      }

      if (!selectedDate || !selectedBlock) return;

      const dateStr = toDateKey(selectedDate);

      // Call the existing createBooking action (purchase logic will be ignored/bypassed)
      const result = await createBooking(
        {
          studentId: context.studentId,
          courseId: course.id,
          teacherId: context.teacherId,
          bookingDate: dateStr,
          startTime: selectedBlock.startTime,
          endTime: selectedBlock.endTime,
          notes: notes.trim() || null,
        },
        { buyNewPack: false }
      );

      if (!result.success) {
        throw new Error(result.error || "預約建立失敗");
      }

      showModal({
        title: "預約已送出",
        description: `已成功預約 ${course.title}，請等待老師確認收款。`,
        confirmText: "查看預約",
        onConfirm: () => router.push("/student/bookings"),
      });
    } catch (err) {
      console.error("Error creating booking:", err);
      showModal({
        title: "送出失敗",
        description:
          err instanceof Error ? err.message : "預約送出失敗，請稍後再試。",
        confirmText: "確定",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!courseId) return <div className="p-10">缺少課程資訊</div>;
  if (loading) return <div className="p-10">載入中...</div>;
  if (!course || error) return <div className="p-10">課程資訊錯誤</div>;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:p-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <Link
            href="/student/courses"
            className="text-sm text-slate-500 hover:text-primary"
          >
            返回列表
          </Link>
          <h1 className="text-3xl font-black mt-2">預約課程：{course.title}</h1>
          <p className="text-slate-500 mt-1">請選擇預約時段或提出申請</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-bold text-lg">1. 選擇預約時數</h2>
                <p className="text-sm text-slate-500 mt-1">
                  後續顯示與申請的時段，會依這個時數自動限制。
                </p>
              </div>
              <div className="w-full sm:w-48">
                <Select
                  label="預約時數"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  options={BOOKING_HOUR_OPTIONS}
                />
              </div>
            </div>
          </div>

          {/* Calendar Step */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">2. 選擇日期</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={prevMonth}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  &lt;
                </button>
                <span>
                  {currentYear}年 {monthNames[currentMonth]}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  &gt;
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {weekDays.map((d) => (
                <div key={d} className="text-xs text-slate-400">
                  {d}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const selected = isSelected(day);
                const past = isPast(day);
                return (
                  <button
                    key={idx}
                    disabled={past}
                    onClick={() => handleDayClick(day)}
                    className={`p-2 rounded-lg transition-colors ${
                      selected
                        ? "bg-primary text-white"
                        : past
                        ? "text-slate-300"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Step */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-bold text-lg">3. 選擇時段</h2>
                <p className="text-sm text-slate-500 mt-1">
                  目前只會顯示連續 {hours} 小時的可預約時段。
                </p>
              </div>
            </div>

            {isFetchingSlots ? (
              <div className="text-center py-10">載入中...</div>
            ) : !selectedDate ? (
              <div className="text-center py-10 text-slate-400">
                請先選擇日期
              </div>
            ) : isRequestMode ? (
              <div className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    提出三個您方便的上課時段：
                    <span className="text-xs font-normal text-slate-500 ml-2">
                      ({slotPreferences.length}/3)
                    </span>
                  </p>
                  <button
                    onClick={() => setIsRequestMode(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                  >
                    返回查看老師開放時段
                  </button>
                </div>

                {slotPreferences.length > 0 && (
                  <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      已選擇的偏好時段
                    </h4>
                    <div className="space-y-2">
                      {slotPreferences.map((pref, i) => (
                        <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-700 p-2 rounded-lg text-sm border border-slate-100 dark:border-slate-600">
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            順位 {i + 1}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 text-xs font-bold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                            {pref.date} {pref.start}-{pref.end}
                          </span>
                          <button
                            onClick={() => {
                              const newPrefs = [...slotPreferences];
                              newPrefs.splice(i, 1);
                              setSlotPreferences(newPrefs);
                              setRequestError(null);
                            }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    選擇 <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">{formattedSelectedDate}</span> 的時段：
                  </h4>

                  <AvailabilityIntervalList
                    requiredDurationMinutes={hours * 60}
                    onBeforeAdd={async (range) => {
                      if (!context?.teacherId || !selectedDateKey) return null;

                      const result = await checkBookingConflict(
                        context.teacherId,
                        selectedDateKey,
                        range.start,
                        range.end
                      );

                      if (result.hasConflict) {
                        return "此申請時段與老師既有預約衝突，請改選其他時間。";
                      }

                      return null;
                    }}
                    value={slotPreferences
                      .filter((p) => p.date === selectedDateKey)
                      .map((p) => ({ start: p.start, end: p.end }))}
                    onChange={(newSlots) => {
                      if (!selectedDateKey) return;
                      const otherDaysPrefs = slotPreferences.filter(
                        (p) => p.date !== selectedDateKey
                      );
                      if (otherDaysPrefs.length + newSlots.length > 3) {
                        setRequestError("總計最多只能提出三個偏好時段");
                        return;
                      }
                      setRequestError(null);
                      setSlotPreferences([
                        ...otherDaysPrefs,
                        ...newSlots.map((s) => ({ ...s, date: selectedDateKey })),
                      ]);
                    }}
                  />
                  {requestError && (
                    <p className="mt-4 text-sm text-red-500 flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      {requestError}
                    </p>
                  )}
                </div>
              </div>
            ) : availableSlots.length === 0 || contiguousBlocks.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 mb-4">
                  老師在您選擇的日期尚未開放足夠的 {hours} 小時連續時段。
                </p>
                <button
                  onClick={() => setIsRequestMode(true)}
                  className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors"
                >
                  提出上課時間申請
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {contiguousBlocks.map((block) => {
                  const isActive =
                    selectedBlock?.startTime === block.startTime;
                  return (
                    <button
                      key={block.startTime}
                      onClick={() => setSelectedBlock(block)}
                      className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-lg"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary"
                      }`}
                    >
                      {block.startTime} - {block.endTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sticky top-24">
            <h3 className="font-bold text-lg mb-4">預約確認</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">課程單價</span>
                <span className="font-bold text-primary">
                  NT$ {(course.price || 0).toLocaleString()} / hr
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">預約日期</span>
                <span className="font-bold">{formattedSelectedDate || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">預約時數</span>
                <span className="font-bold">{hours} 小時</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500 w-24">已選時段</span>
                <span className="font-bold text-right text-sm">
                  {isRequestMode ? (
                    slotPreferences.length > 0 ? (
                      <div className="space-y-1">
                        {slotPreferences.map((pref, idx) => (
                          <div key={idx} className="text-xs text-slate-400">
                            順位 {idx + 1}: {pref.date} {pref.start}-{pref.end}
                          </div>
                        ))}
                      </div>
                    ) : "等待選擇申請時段..."
                  ) : selectedBlock ? (
                    `${selectedBlock.startTime} - ${selectedBlock.endTime}`
                  ) : "-"}
                </span>
              </div>
              <div className="flex justify-between text-lg border-t dark:border-slate-700 pt-4 mt-2">
                <span className="font-bold">總計金額</span>
                <span className="font-black text-primary">
                  NT$ {((course.price || 0) * hours).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 mb-2">
                備註給老師
              </label>
              <textarea
                className="w-full border dark:border-slate-700 dark:bg-slate-900 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
                placeholder="有什麼想先讓老師知道的嗎？"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={
                (isRequestMode && slotPreferences.length !== 3) ||
                (!isRequestMode && !selectedBlock) ||
                submitting
              }
              className="w-full py-4 rounded-xl bg-primary text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {submitting
                ? "處理中..."
                : isRequestMode
                ? "送出申請"
                : "確認預約"}
            </button>
            <p className="text-xs text-center text-slate-400 mt-4 leading-relaxed">
              預約提出後，即代表確認購買課程，<br />
              後續請透過約定方式付款給老師。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
