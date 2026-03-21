"use client";

import React, { useState } from "react";
import { useModal } from "@/components/providers/ModalContext";
import { Modal } from "@/components/ui/Modal";
import { useStudentBookings } from "./useStudentBookings";
import { requestReschedule } from "@/app/actions/reschedule";
import Select from "@/components/ui/Select";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const ampm = h < 12 ? "上午" : "下午";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const value = `${h.toString().padStart(2, "0")}:${m}`;
  const label = `${ampm} ${displayH.toString().padStart(2, "0")}:${m}`;
  return { value, label };
});

export default function BookingPage() {
  const { bookings, slotRequests, loading, error } = useStudentBookings();
  const [activeTab, setActiveTab] = useState<
    "requesting" | "requestResults" | "reviewing" | "upcoming" | "history"
  >(
    "requesting"
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

  const pendingSlotRequests = slotRequests.filter((request) => request.status === "pending");
  const resolvedSlotRequests = slotRequests.filter(
    (request) => request.status === "approved" || request.status === "rejected"
  );
  const reviewingBookings = bookings.filter((b) => b.status === "pending");
  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "paid"
  );
  const historyBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled"
  );

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
            activeTab === "requesting"
              ? "border-primary text-primary"
              : "border-transparent text-text-sub hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("requesting")}
        >
          申請中
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "requestResults"
              ? "border-primary text-primary"
              : "border-transparent text-text-sub hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("requestResults")}
        >
          申請結果
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "reviewing"
              ? "border-primary text-primary"
              : "border-transparent text-text-sub hover:text-slate-800"
          }`}
          onClick={() => setActiveTab("reviewing")}
        >
          審核中
        </button>
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
        {activeTab === "requesting" ? (
          pendingSlotRequests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-text-sub">目前沒有申請中的時段申請</p>
            </div>
          ) : (
            pendingSlotRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">
                    申請中
                  </span>
                  <span className="text-sm text-text-sub">
                    {request.courseTitle || "課程時段申請"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  已送出 3 個希望時段，等待老師審核
                </h3>
                <div className="flex items-center gap-4 text-sm text-text-sub mb-4">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      person
                    </span>
                    {request.teacherName || "講師"}
                  </span>
                </div>
                <div className="grid gap-2">
                  {[
                    {
                      label: "順位 1",
                      date: request.preference1Date,
                      start: request.preference1Start,
                      end: request.preference1End,
                    },
                    {
                      label: "順位 2",
                      date: request.preference2Date,
                      start: request.preference2Start,
                      end: request.preference2End,
                    },
                    {
                      label: "順位 3",
                      date: request.preference3Date,
                      start: request.preference3Start,
                      end: request.preference3End,
                    },
                  ].map((preference) => (
                    <div
                      key={`${request.id}-${preference.label}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {preference.label}
                      </span>
                      <span className="text-text-sub">
                        {preference.date} {preference.start} - {preference.end}
                      </span>
                    </div>
                  ))}
                </div>
                {request.notes ? (
                  <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm text-text-sub">
                    備註：{request.notes}
                  </div>
                ) : null}
              </div>
            ))
          )
        ) : activeTab === "requestResults" ? (
          resolvedSlotRequests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-text-sub">目前沒有可查看的申請結果</p>
            </div>
          ) : (
            resolvedSlotRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      request.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {request.status === "approved" ? "已核准" : "已婉拒"}
                  </span>
                  <span className="text-sm text-text-sub">
                    {request.courseTitle || "課程時段申請"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  {request.status === "approved"
                    ? "老師已確認您的時段申請"
                    : "老師未採用這次時段申請"}
                </h3>
                <div className="flex items-center gap-4 text-sm text-text-sub mb-4">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      person
                    </span>
                    {request.teacherName || "講師"}
                  </span>
                </div>
                <div className="grid gap-2">
                  {[
                    {
                      label: "順位 1",
                      date: request.preference1Date,
                      start: request.preference1Start,
                      end: request.preference1End,
                    },
                    {
                      label: "順位 2",
                      date: request.preference2Date,
                      start: request.preference2Start,
                      end: request.preference2End,
                    },
                    {
                      label: "順位 3",
                      date: request.preference3Date,
                      start: request.preference3Start,
                      end: request.preference3End,
                    },
                  ].map((preference) => (
                    <div
                      key={`${request.id}-${preference.label}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm"
                    >
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {preference.label}
                      </span>
                      <span className="text-text-sub">
                        {preference.date} {preference.start} - {preference.end}
                      </span>
                    </div>
                  ))}
                </div>
                {request.status === "approved" ? (
                  <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    您的申請已成立正式預約，可至「即將到來」或「歷史紀錄」查看。
                  </div>
                ) : request.rejectReason ? (
                  <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                    老師回覆：{request.rejectReason}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 px-4 py-3 text-sm text-text-sub">
                    此次申請未被採用，您可以重新提出新的時段申請。
                  </div>
                )}
              </div>
            ))
          )
        ) : activeTab === "reviewing" ? (
          reviewingBookings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-text-sub">尚無資料</p>
            </div>
          ) : (
            reviewingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">
                      待確認
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

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleRescheduleClick(booking.id)}
                    className="flex-1 md:flex-none px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
                  >
                    改期 / 取消
                  </button>
                </div>
              </div>
            ))
          )
        ) : activeTab === "upcoming" ? (
          upcomingBookings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="text-text-sub">尚無資料</p>
            </div>
          ) : (
            upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        booking.status === "paid"
                          ? "bg-teal-100 text-teal-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {booking.status === "paid" ? "已收款" : "已確認"}
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
              </div>
            ))
          )
        ) : historyBookings.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <p className="text-text-sub">尚無資料</p>
          </div>
        ) : (
          historyBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      booking.status === "paid"
                        ? "bg-teal-100 text-teal-700"
                        : booking.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : booking.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {booking.status === "paid"
                      ? "已收款"
                      : booking.status === "confirmed"
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
            <div className="w-full">
              <Select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                options={TIME_OPTIONS}
                icon="schedule"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
