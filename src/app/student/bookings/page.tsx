"use client";

import React, { useState } from "react";
import { useModal } from "@/components/providers/ModalContext";
import { Modal } from "@/components/ui/Modal";
import { useStudentBookings } from "./useStudentBookings";
import { Booking } from "@/lib/domain/booking/entity";
import { requestReschedule } from "@/app/actions/reschedule";

export default function BookingPage() {
  const { bookings, loading, error } = useStudentBookings();
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming"
  );
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const { showModal } = useModal();

  // Reschedule State
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRescheduleClick = (id: string) => {
    setRescheduleId(id);
    setNewDate("");
    setNewTime("");
  };

  const confirmReschedule = async () => {
    if (!rescheduleId || !newDate || !newTime) return;
    setIsSubmitting(true);
    
    try {
      const newStartTime = `${newDate}T${newTime}`;
      await requestReschedule(rescheduleId, newStartTime, "學員提出改期申請");
      setRescheduleId(null);
      showModal({
        title: "改期申請已送出",
        description: `已申請改期至 ${newDate} ${newTime}，請等待老師確認。`,
        type: "success",
      });
    } catch (err) {
      console.error(err);
      showModal({
        title: "申請失敗",
        description: err instanceof Error ? err.message : "無法送出改期申請，請檢查時間是否有效或稍後再試。",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-5xl flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  );
  const historyBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled"
  );

  const displayList =
    activeTab === "upcoming" ? upcomingBookings : historyBookings;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          我的預約課程
        </h1>
        <p className="text-text-sub">查看您的課程時間表或進行改期</p>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      {/* Booking Tabs */}
      <div className="flex border-b border-border-light dark:border-border-dark mb-6">
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "upcoming"
              ? "border-primary text-primary"
              : "border-transparent text-text-sub hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          即將到來
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-text-sub hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("history")}
        >
          歷史紀錄
        </button>
      </div>

      {/* Booking List */}
      <div className="space-y-4">
        {displayList.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-text-sub">尚無資料</p>
          </div>
        ) : (
          displayList.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : booking.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {booking.status === "confirmed"
                      ? "已確認"
                      : booking.status === "pending"
                      ? "待確認"
                      : booking.status === "completed"
                      ? "已完成"
                      : "已取消"}
                  </span>
                  <span className="text-sm text-text-sub">
                    {booking.bookingDate} • {booking.startTime} - {booking.endTime}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  {booking.courseTitle}
                </h3>
                <div className="flex items-center gap-4 text-sm text-text-sub">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      person
                    </span>{" "}
                    {booking.teacherName || "講師"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      location_on
                    </span>{" "}
                    {booking.location || (booking.courseType === 'online' ? '線上會議' : '實體教室')}
                  </span>
                </div>
              </div>

              {activeTab === "upcoming" && (
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleRescheduleClick(booking.id)}
                    className="flex-1 md:flex-none px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
                  >
                    改期 / 取消
                  </button>
                  <button className="flex-1 md:flex-none px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium shadow-sm transition-colors">
                    進入教室
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleId}
        onClose={() => setRescheduleId(null)}
        title="更改預約時間"
        description="請選擇新的日期與時間，送出後需等待老師確認。"
        confirmText="確認送出"
        onConfirm={confirmReschedule}
        showCancel
        cancelText="取消"
        onCancel={() => setRescheduleId(null)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
              日期
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-gray-700/50 border-slate-200 dark:border-gray-600 focus:ring-primary focus:border-primary transition-all"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
              時間
            </label>
            <input
              type="time"
              className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-gray-700/50 border-slate-200 dark:border-gray-600 focus:ring-primary focus:border-primary transition-all"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}