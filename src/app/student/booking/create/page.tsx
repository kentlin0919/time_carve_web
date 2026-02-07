"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";
import { useStudentCourseDetail } from "../../courses/useStudentTeacherCourses";
import { getAvailableSlots, createBooking } from "@/app/actions/booking";
import { getStudentPurchases, purchaseCourse } from "@/app/actions/purchase";
import { Purchase } from "@/lib/domain/purchase/entity";

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

export default function StudentBookingCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showModal } = useModal();
  const courseId = searchParams.get("courseId") || "";
  const hoursParam = Number(searchParams.get("hours")) || 1;
  const [hours, setHours] = useState(Math.max(1, hoursParam));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [buyNewPack, setBuyNewPack] = useState(false);

  // Purchase State
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  // Calendar State
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Split Booking State
  const [availableSlots, setAvailableSlots] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]); // Array of startTimes in 30-min chunks
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);

  const { course, context, loading, error } = useStudentCourseDetail(courseId);

  // Fetch Purchases
  useEffect(() => {
    async function fetchPurchases() {
      try {
        const myPurchases = await getStudentPurchases();
        setPurchases(myPurchases);
      } catch (e) {
        console.error("Failed to fetch purchases", e);
      }
    }
    fetchPurchases();
  }, []);

  // Determine applicable purchase for this course
  const applicablePurchase = useMemo(() => {
    return purchases.find(p => p.courseId === courseId && p.status === 'active');
  }, [purchases, courseId]);

  // Auto-select or set default buy mode
  useEffect(() => {
    if (applicablePurchase) {
      if (applicablePurchase.remainingHours >= hours) {
        setSelectedPurchaseId(applicablePurchase.id);
        setBuyNewPack(false);
      } else {
        setSelectedPurchaseId(null);
        setBuyNewPack(true); // Default to buy new if existing is insufficient
      }
    } else {
      setSelectedPurchaseId(null);
      setBuyNewPack(true); // Default to buy new if no pack exists
    }
  }, [applicablePurchase, hours]);

  useEffect(() => {
    setHours(Math.max(1, hoursParam));
  }, [hoursParam]);

  useEffect(() => {
    async function fetchSlots() {
      if (selectedDate && context?.teacherId) {
        setIsFetchingSlots(true);
        setSelectedSlots([]);
        try {
          // Format date as YYYY-MM-DD (local)
          const dateStr = `${selectedDate.getFullYear()}-${String(
            selectedDate.getMonth() + 1
          ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

          // Always fetch 30-minute slots to support split booking
          const slots = await getAvailableSlots(
            context.teacherId,
            dateStr,
            dateStr,
            30 // Duration fixed to 30 mins
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

    // Sort slots just in case
    const sorted = [...availableSlots].sort(
      (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
    );
    const blocks: { startTime: string; endTime: string }[] = [];
    const requiredDuration = hours * 60;

    // Naive Check: For each slot, check if subsequent slots exist to form the block
    for (const slot of sorted) {
      const startMins = toMinutes(slot.startTime);
      const targetEndMins = startMins + requiredDuration;

      // Check if we have slots covering [startMins, targetEndMins)
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

  // Effect to toggle split mode if no contiguous blocks found (and we have availability)
  useEffect(() => {
    if (availableSlots.length > 0 && contiguousBlocks.length === 0) {
      setIsSplitMode(true);
    } else if (contiguousBlocks.length > 0) {
      setIsSplitMode(false);
    }
  }, [availableSlots, contiguousBlocks.length]);

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

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
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

  // Interactions
  const handleDayClick = (day: number) => {
    if (isPast(day)) return;
    setSelectedDate(new Date(currentYear, currentMonth, day));
    setSelectedSlots([]); // Reset selection
  };

  // Standard Mode: Select a block
  const handleBlockClick = (startTime: string) => {
    // Generate all 30-min slots for this block
    const newSlots: string[] = [];
    const startMins = toMinutes(startTime);
    const count = hours * 2; // e.g. 1 hour = 2 slots
    for (let i = 0; i < count; i++) {
      newSlots.push(toTimeStr(startMins + i * 30));
    }
    setSelectedSlots(newSlots);
  };

  // Split Mode: Toggle 30-min slot
  const handleSlotToggle = (startTime: string) => {
    setSelectedSlots((prev) => {
      if (prev.includes(startTime)) {
        return prev.filter((s) => s !== startTime);
      } else {
        if (prev.length >= hours * 2) {
          return [...prev, startTime];
        }
        return [...prev, startTime];
      }
    });
  };

  const packHours = useMemo(() => {
    if (!course?.durationMinutes) return 0;
    return course.durationMinutes / 60;
  }, [course]);

  const totalPrice = useMemo(() => {
    if (selectedPurchaseId) return 0;
    if (buyNewPack) return course?.price || 0;
    if (!course?.price) return 0;
    return course.price * hours;
  }, [course?.price, hours, selectedPurchaseId, buyNewPack]);

  const remainingAfterBooking = useMemo(() => {
    if (selectedPurchaseId && applicablePurchase) {
      return applicablePurchase.remainingHours - hours;
    }
    if (buyNewPack) {
      return packHours - hours;
    }
    return 0;
  }, [selectedPurchaseId, applicablePurchase, buyNewPack, hours, packHours]);

  const formattedSelectedDate = selectedDate
    ? `${selectedDate.getFullYear()}年 ${selectedDate.getMonth() + 1
    }月 ${selectedDate.getDate()}日 (${weekDays[selectedDate.getDay()]})`
    : null;

  // Selected Count Check
  const selectedCount = selectedSlots.length;
  const requiredCount = hours * 2;
  const isComplete = selectedCount === requiredCount;
  const isPurchaseOnly = selectedDate && availableSlots.length === 0 && buyNewPack;

  const handleConfirm = async () => {
    if (!course || !context || !selectedDate) return;
    if (!isComplete && !isPurchaseOnly) return;

    if (submitting) return;
    setSubmitting(true);

    try {
      if (isPurchaseOnly) {
        // Just buy the pack and init progress
        await purchaseCourse(course.id, packHours, course.price || 0);
        
        showModal({
          title: "方案購買成功",
          description: `您已成功購買 ${course.title} 方案 (${packHours} 小時)。老師目前尚未設定預約時段，時數已存入您的帳戶，待老師設定後即可預約。`,
          confirmText: "查看進度",
          onConfirm: () => router.push("/student/progress"),
        });
        return;
      }

      const dateStr = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

      // 1. Group selectedSlots into contiguous chunks
      const sorted = [...selectedSlots].sort(
        (a, b) => toMinutes(a) - toMinutes(b)
      );
      const chunks: { start: string; end: string }[] = [];

      let currentStart = sorted[0];
      let currentEndMins = toMinutes(sorted[0]) + 30;

      for (let i = 1; i < sorted.length; i++) {
        const nextStartMins = toMinutes(sorted[i]);
        if (nextStartMins === currentEndMins) {
          // Contiguous
          currentEndMins += 30;
        } else {
          // Break
          chunks.push({ start: currentStart, end: toTimeStr(currentEndMins) });
          currentStart = sorted[i];
          currentEndMins = toMinutes(sorted[i]) + 30;
        }
      }
      chunks.push({ start: currentStart, end: toTimeStr(currentEndMins) });

      // 2. Submit bookings sequentially
      let activePurchaseId = selectedPurchaseId;
      let isFirstCall = true;

      for (const chunk of chunks) {
        const result = await createBooking({
          studentId: context.studentId,
          courseId: course.id,
          teacherId: context.teacherId,
          bookingDate: dateStr,
          startTime: chunk.start,
          endTime: chunk.end,
          notes: notes.trim() || null,
          purchaseId: activePurchaseId
        }, {
          buyNewPack: isFirstCall ? buyNewPack : false // Only buy on first call
        });

        // Capture newly created purchaseId for subsequent chunks
        if (isFirstCall && buyNewPack && result.purchaseId) {
          activePurchaseId = result.purchaseId;
        }
        isFirstCall = false;
      }

      showModal({
        title: "預約已送出",
        description: buyNewPack 
          ? `已成功購買方案並預約 ${course.title}，剩餘時數已存入您的帳戶。`
          : `已成功預約 ${course.title}，共 ${chunks.length} 個時段。`,
        confirmText: "查看預約",
        onConfirm: () => router.push("/student/bookings"),
      });
    } catch (err) {
      console.error("Error creating booking:", err);
      showModal({
        title: "送出失敗",
        description: err instanceof Error ? err.message : "預約送出失敗，請稍後再試。",
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
    <div className="container mx-auto max-w-6xl p-6 md:p-10 pb-24">
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
          <p className="text-slate-500 mt-1">請選擇預約時段</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Calendar Step */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">1. 選擇日期</h2>
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
                    className={`p-2 rounded-lg transition-colors ${selected
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
              <h2 className="font-bold text-lg">
                2. 選擇時段 {isSplitMode ? "(拆分模式)" : ""}
              </h2>
              {availableSlots.length > 0 && (
                <button
                  onClick={() => {
                    setIsSplitMode(!isSplitMode);
                    setSelectedSlots([]); // Reset on mode switch
                  }}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  {isSplitMode ? "切換至標準模式" : "切換至自訂拆分模式"}
                </button>
              )}
            </div>

            {isFetchingSlots ? (
              <div className="text-center py-10">載入中...</div>
            ) : !selectedDate ? (
              <div className="text-center py-10 text-slate-400">
                請先選擇日期
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 mb-4">老師目前尚未設定可預約時段。</p>
                {buyNewPack && (
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm text-primary">
                    您可以先完成方案購買，系統將為您建立學習進度，待老師開放時段後即可進行預約。
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mode Logic */}
                {!isSplitMode ? (
                  contiguousBlocks.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-slate-500 mb-2">
                        無符合 {hours} 小時的連續時段。
                      </p>
                      <button
                        onClick={() => setIsSplitMode(true)}
                        className="text-primary font-bold underline"
                      >
                        嘗試拆分預約
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {contiguousBlocks.map((block) => (
                        <button
                          key={block.startTime}
                          onClick={() => handleBlockClick(block.startTime)}
                          className={`p-3 rounded-xl border text-sm font-bold transition-all ${selectedSlots[0] === block.startTime // Simple check
                            ? "bg-primary text-white border-primary shadow-lg"
                            : "border-slate-200 hover:border-primary hover:text-primary"
                            }`}
                        >
                          {block.startTime} - {block.endTime}
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <div>
                    <p className="text-sm text-slate-500 mb-4">
                      請選擇 {requiredCount} 個 30 分鐘時段 (已選:{" "}
                      <span
                        className={
                          selectedCount === requiredCount
                            ? "text-green-500 font-bold"
                            : "text-red-500 font-bold"
                        }
                      >
                        {selectedCount}
                      </span>{" "}
                      / {requiredCount})
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => {
                        const isActive = selectedSlots.includes(slot.startTime);
                        return (
                          <button
                            key={slot.startTime}
                            onClick={() => handleSlotToggle(slot.startTime)}
                            className={`p-2 rounded-lg border text-xs font-bold ${isActive
                              ? "bg-primary text-white border-primary"
                              : "border-slate-200 hover:bg-slate-50"
                              }`}
                          >
                            {slot.startTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sticky top-24">
            <h3 className="font-bold text-lg mb-4">預約確認</h3>

            {/* Payment Method Selection */}
            <div className="space-y-3 mb-6">
              {applicablePurchase && (
                <div
                  className={`p-3 rounded-xl border ${selectedPurchaseId === applicablePurchase.id
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-900/10"
                    : "border-slate-200"
                    } transition-all cursor-pointer`}
                  onClick={() => {
                    setSelectedPurchaseId(applicablePurchase.id);
                    setBuyNewPack(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPurchaseId === applicablePurchase.id
                          ? "border-teal-500"
                          : "border-slate-400"
                          }`}
                      >
                        {selectedPurchaseId === applicablePurchase.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                        )}
                      </div>
                      <span className="font-bold text-sm text-slate-800 dark:text-white">
                        使用現有課程包
                      </span>
                    </div>
                    <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                      剩餘 {applicablePurchase.remainingHours} hr
                    </span>
                  </div>
                </div>
              )}

              <div
                className={`p-3 rounded-xl border ${buyNewPack
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-slate-200"
                  } transition-all cursor-pointer`}
                onClick={() => {
                  setSelectedPurchaseId(null);
                  setBuyNewPack(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${buyNewPack
                        ? "border-primary"
                        : "border-slate-400"
                        }`}
                    >
                      {buyNewPack && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">
                        購買新課程方案
                      </span>
                      <span className="text-[10px] text-slate-500">包含 {packHours} 小時時數</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    NT$ {course.price?.toLocaleString()}
                  </span>
                </div>
              </div>

              {!applicablePurchase && !buyNewPack && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-700">
                  * 建議購買課程方案以獲得更完整的學習追蹤與時數優惠。
                </div>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">預約日期</span>
                <span className="font-bold">
                  {formattedSelectedDate || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">本次預約時數</span>
                <span className="font-bold">{hours} 小時</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">已選時段</span>
                <span className="font-bold text-right">
                  {selectedCount > 0
                    ? isSplitMode
                      ? `${selectedCount} 個時段 (${(selectedCount * 30) / 60
                      } hr)`
                      : `${selectedSlots[0]} 起`
                    : "-"}
                </span>
              </div>
              {(selectedPurchaseId || buyNewPack) && (
                <div className="flex justify-between text-teal-600 dark:text-teal-400 text-sm font-medium">
                  <span>預估剩餘時數</span>
                  <span className="font-bold">{remainingAfterBooking} hr</span>
                </div>
              )}
              <div className="flex justify-between text-lg border-t pt-4 mt-2">
                <span className="font-bold">總付款金額</span>
                <span className="font-black text-primary">
                  {selectedPurchaseId ? (
                    <span>
                      <span className="line-through text-slate-400 text-sm mr-2">
                        NT$ {((course.price || 0) * hours).toLocaleString()}
                      </span>
                      0{" "}
                      <span className="text-xs font-normal text-slate-500">
                        (扣除 {hours} hr)
                      </span>
                    </span>
                  ) : buyNewPack ? (
                    `NT$ ${course.price?.toLocaleString()}`
                  ) : (
                    `NT$ ${totalPrice.toLocaleString()}`
                  )}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 mb-2">
                備註
              </label>
              <textarea
                className="w-full border rounded-lg p-2 text-sm"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={(!isComplete && !isPurchaseOnly) || submitting}
              className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              {submitting ? "處理中..." : isPurchaseOnly ? "購買方案" : "確認預約"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
