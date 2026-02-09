"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";
import { getAvailableSlots, getBookingById } from "@/app/actions/booking";
import { requestReschedule } from "@/app/actions/reschedule";
import { Booking } from "@/lib/domain/booking/entity";

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

export default function StudentBookingReschedulePage() {
    const router = useRouter();
    const params = useParams();
    const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
    const { showModal } = useModal();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Calendar State
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Slot Selection
    const [availableSlots, setAvailableSlots] = useState<
        { startTime: string; endTime: string }[]
    >([]);
    // For reschedule, we typically select a NEW start time.
    // The duration is fixed based on original booking.
    const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);

    // Fetch Booking Details
    useEffect(() => {
        if (!bookingId) return;
        async function fetchBooking() {
            try {
                const data = await getBookingById(bookingId);
                if (data) {
                    setBooking(data);
                } else {
                    setError("Booking not found");
                }
            } catch (e) {
                console.error(e);
                setError("Failed to load booking details");
            } finally {
                setLoading(false);
            }
        }
        fetchBooking();
    }, [bookingId]);

    // Fetch Slots
    useEffect(() => {
        async function fetchSlots() {
            if (selectedDate && booking?.teacherId) {
                setIsFetchingSlots(true);
                setSelectedStartTime(null);
                try {
                    const dateStr = `${selectedDate.getFullYear()}-${String(
                        selectedDate.getMonth() + 1
                    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

                    // Fetch slots with standard 30 min duration chunks
                    // But we need to find contiguous blocks matching booking duration
                    const slots = await getAvailableSlots(
                        booking.teacherId,
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
    }, [selectedDate, booking?.teacherId]);

    // Calculate Duration in Hours
    const durationHours = useMemo(() => {
        if (!booking) return 0;
        const start = toMinutes(booking.startTime);
        const end = toMinutes(booking.endTime);
        return (end - start) / 60;
    }, [booking]);

    // Derive Contiguous Blocks matching duration
    const contiguousBlocks = useMemo(() => {
        if (!availableSlots.length || !durationHours) return [];

        const sorted = [...availableSlots].sort(
            (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
        );
        const blocks: { startTime: string; endTime: string }[] = [];
        const requiredDuration = durationHours * 60;

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
    }, [availableSlots, durationHours]);

    // Calendar logic
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
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
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    };

    const isPast = (day: number) => {
        const checkDate = new Date(currentYear, currentMonth, day);
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return checkDate < todayStart;
    };

    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
    };

    const handleDayClick = (day: number) => {
        if (isPast(day)) return;
        setSelectedDate(new Date(currentYear, currentMonth, day));
        setSelectedStartTime(null);
    };

    const formattedSelectedDate = selectedDate
        ? `${selectedDate.getFullYear()}年 ${selectedDate.getMonth() + 1}月 ${selectedDate.getDate()}日 (${weekDays[selectedDate.getDay()]})`
        : null;


    const handleConfirm = async () => {
        if (!bookingId || !selectedDate || !selectedStartTime) return;
        if (submitting) return;

        setSubmitting(true);
        try {
            const dateStr = `${selectedDate.getFullYear()}-${String(
                selectedDate.getMonth() + 1
            ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

            const newStartISO = `${dateStr}T${selectedStartTime}`;

            await requestReschedule(bookingId, newStartISO, notes.trim() || undefined);

            showModal({
                title: "申請已送出",
                description: "您的改期申請已送出，請等待老師審核確認。",
                confirmText: "返回預約詳情",
                onConfirm: () => router.push(`/student/bookings/${bookingId}`),
            });
        } catch (err) {
            console.error(err);
            showModal({
                title: "送出失敗",
                description: err instanceof Error ? err.message : "申請失敗，請稍後再試。",
                confirmText: "確定",
            });
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;
    if (error || !booking) return <div className="p-10 text-center text-slate-500">無法載入預約資訊</div>;

    return (
        <div className="container mx-auto max-w-6xl p-6 md:p-10 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <Link
                        href={`/student/bookings/${bookingId}`}
                        className="text-sm text-slate-500 hover:text-primary mb-2 inline-block"
                    >
                        &lt; 返回預約詳情
                    </Link>
                    <h1 className="text-3xl font-black mt-1">申請改期</h1>
                    <p className="text-slate-500 mt-1">
                        原預約：{booking.courseTitle}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Calendar Step */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-lg">1. 選擇新日期</h2>
                            <div className="flex items-center gap-4">
                                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">&lt;</button>
                                <span>{currentYear}年 {monthNames[currentMonth]}</span>
                                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">&gt;</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center">
                            {weekDays.map((d) => (
                                <div key={d} className="text-xs text-slate-400">{d}</div>
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
                        <h2 className="font-bold text-lg mb-6">2. 選擇新時段 (需 {durationHours} 小時)</h2>

                        {isFetchingSlots ? (
                            <div className="text-center py-10">載入中...</div>
                        ) : !selectedDate ? (
                            <div className="text-center py-10 text-slate-400">請先選擇日期</div>
                        ) : availableSlots.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">本日無可用時段</div>
                        ) : (
                            <div>
                                {contiguousBlocks.length === 0 ? (
                                    <div className="text-center py-6 text-slate-500">
                                        無符合 {durationHours} 小時的連續時段。
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {contiguousBlocks.map((block) => (
                                            <button
                                                key={block.startTime}
                                                onClick={() => setSelectedStartTime(block.startTime)}
                                                className={`p-3 rounded-xl border text-sm font-bold transition-all ${selectedStartTime === block.startTime
                                                    ? "bg-primary text-white border-primary shadow-lg"
                                                    : "border-slate-200 hover:border-primary hover:text-primary"
                                                    }`}
                                            >
                                                {block.startTime} - {block.endTime}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4">改期確認</h3>

                        <div className="space-y-4 mb-6 relative">
                            {/* Arrow */}
                            <div className="absolute left-[13px] top-[40px] bottom-[30px] w-[2px] bg-slate-100 dark:bg-slate-700"></div>

                            {/* Old Slot */}
                            <div className="relative pl-8">
                                <div className="absolute left-0 top-1 w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-[16px]">history</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">原預約時段</p>
                                <p className="font-bold text-slate-800 dark:text-white">
                                    {booking.bookingDate}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {booking.startTime} - {booking.endTime}
                                </p>
                            </div>

                            {/* New Slot */}
                            <div className="relative pl-8 pt-4">
                                <div className={`absolute left-0 top-5 w-7 h-7 rounded-full flex items-center justify-center ${selectedStartTime ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-[16px]">update</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">新預約時段</p>
                                {selectedStartTime && selectedDate ? (
                                    <>
                                        <p className="font-bold text-slate-800 dark:text-white">
                                            {formattedSelectedDate}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">
                                            {selectedStartTime} - {toTimeStr(toMinutes(selectedStartTime) + durationHours * 60)}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">尚未選擇</p>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-2">
                                改期原因 (選填)
                            </label>
                            <textarea
                                className="w-full border rounded-lg p-2 text-sm bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700"
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="請說明改期原因..."
                            />
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={!selectedStartTime || submitting}
                            className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors shadow-lg"
                        >
                            {submitting ? "處理中..." : "送出改期申請"}
                        </button>

                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-[10px] text-amber-700 dark:text-amber-400">
                            * 改期申請送出後，原時段將暫時保留，直到老師確認您的新時段。
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
