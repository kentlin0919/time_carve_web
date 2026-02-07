"use client";

import React, { useState, useEffect } from "react";
import {
  getTeacherPayments,
  PaymentRecord,
  PaymentSummary,
} from "@/app/actions/payment";
import { updateBookingStatus } from "@/app/actions/booking";

type FilterType = "all" | "pending" | "received" | "overdue";

export default function PaymentManagementPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // bookingId or null
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total_projected: 0,
    total_received: 0,
    pending_count: 0,
    overdue_count: 0,
    overdue_amount: 0,
  });
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Date State
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(); // In a real app we might want to separate search to avoid double fetching if not needed, but here simple is fine
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { records: fetchedRecords, summary: fetchedSummary } =
        await getTeacherPayments(selectedYear, selectedMonth, searchQuery);
      setRecords(fetchedRecords);
      setSummary(fetchedSummary);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      // Ideally show toast error here
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: "confirmed" | "cancelled"
  ) => {
    if (
      confirm(
        newStatus === "confirmed"
          ? "確定要標記為已收款嗎？"
          : "確定要取消此款項嗎？"
      )
    ) {
      setActionLoading(bookingId);
      try {
        await updateBookingStatus(bookingId, newStatus);
        // If no error thrown, success
        await fetchData();
      } catch (e: any) {
        console.error(e);
        alert("更新失敗: " + (e.message || "發生錯誤"));
      } finally {
        setActionLoading(null);
      }
    }
  };

  const filteredRecords = records.filter((record) => {
    if (filter === "all") return true;
    if (filter === "overdue") return record.is_overdue;
    if (filter === "pending")
      return record.status === "pending" && !record.is_overdue;
    if (filter === "received")
      return record.status === "completed" || record.status === "confirmed";
    return true;
  });

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i); // 5 years range
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Helper for currency
  const formatCurrency = (amount: number) => `NT$ ${amount.toLocaleString()}`;

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-8 py-4 flex justify-between items-center sticky top-0 z-10 transition-all">
        <div className="flex flex-col">
          <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight flex items-center gap-2">
            收款管理
          </h2>
          <p className="text-text-sub dark:text-gray-400 text-sm mt-0.5">
            本月應收{" "}
            <span className="text-primary font-bold">
              {formatCurrency(summary.total_projected)}
            </span>
            ， 目前尚有{" "}
            <span className="text-red-500 font-bold">
              {summary.overdue_count}
            </span>{" "}
            筆款項逾期
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button className="size-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark text-text-sub hover:text-primary transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
            </button>
            <button className="size-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark text-text-sub hover:text-primary transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[20px]">
                help
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-border-light dark:border-border-dark shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="flex flex-col z-10">
                <p className="text-text-sub text-xs font-semibold uppercase tracking-wide">
                  本月預估總收入
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                  {formatCurrency(summary.total_projected)}
                </p>
                {/* Placeholder trend logic */}
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-sm">
                    trending_up
                  </span>
                  預估
                </p>
              </div>
              <div className="size-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">attach_money</span>
              </div>
              <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none"></div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-border-light dark:border-border-dark shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="flex flex-col z-10">
                <p className="text-text-sub text-xs font-semibold uppercase tracking-wide">
                  實際已收款
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(summary.total_received)}
                </p>
                <p className="text-xs text-text-sub mt-1">
                  達成率{" "}
                  {summary.total_projected > 0
                    ? Math.round(
                        (summary.total_received / summary.total_projected) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
              <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-emerald-50/50 to-transparent dark:from-emerald-900/10 pointer-events-none"></div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-border-light dark:border-border-dark shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="flex flex-col z-10">
                <p className="text-text-sub text-xs font-semibold uppercase tracking-wide">
                  待收與逾期
                </p>
                <p className="text-2xl font-bold text-orange-500 dark:text-orange-400 mt-1">
                  {formatCurrency(
                    summary.total_projected - summary.total_received
                  )}
                </p>
                <p className="text-xs text-red-500 mt-1 font-medium">
                  包含 {summary.overdue_count} 筆逾期 (
                  {formatCurrency(summary.overdue_amount)})
                </p>
              </div>
              <div className="size-12 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">pending</span>
              </div>
              <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-orange-50/50 to-transparent dark:from-orange-900/10 pointer-events-none"></div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card flex flex-col overflow-hidden min-h-[400px]">
            {/* Filter Bar */}
            <div className="p-5 border-b border-border-light dark:border-border-dark flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-50/30 dark:bg-slate-800/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-auto flex gap-2">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub text-[18px]">
                      calendar_month
                    </span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="pl-10 pr-8 py-2 w-32 rounded-lg border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none appearance-none cursor-pointer text-slate-700 dark:text-gray-200"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}年
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-sub text-[18px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="pl-4 pr-8 py-2 w-24 rounded-lg border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none appearance-none cursor-pointer text-slate-700 dark:text-gray-200"
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}月
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-sub text-[18px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-border-light dark:border-border-dark w-full sm:w-auto overflow-x-auto">
                  <button
                    onClick={() => setFilter("all")}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                      filter === "all"
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600"
                        : "text-text-sub hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setFilter("pending")}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                      filter === "pending"
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600"
                        : "text-text-sub hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    待收款
                  </button>
                  <button
                    onClick={() => setFilter("received")}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                      filter === "received"
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600"
                        : "text-text-sub hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    已收款
                  </button>
                  <button
                    onClick={() => setFilter("overdue")}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                      filter === "overdue"
                        ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                        : "text-text-sub hover:bg-slate-50 dark:hover:bg-slate-700 text-red-500"
                    }`}
                  >
                    逾期
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative group flex-1 lg:flex-none">
                  <input
                    className="pl-10 pr-4 py-2 w-full lg:w-64 rounded-lg border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                    placeholder="搜尋學生姓名..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub group-focus-within:text-primary text-[18px] transition-colors">
                    search
                  </span>
                </div>
                <button
                  className="flex items-center justify-center size-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-text-sub hover:text-primary hover:border-primary transition-colors shadow-sm"
                  title="匯出報表"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    download
                  </span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[300px]">
              {loading ? (
                <div className="h-full flex items-center justify-center py-20">
                  <span className="material-symbols-outlined text-4xl animate-spin text-primary">
                    progress_activity
                  </span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-text-sub">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                    inbox
                  </span>
                  <p>沒有找到相關記錄</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-text-sub uppercase border-b border-border-light dark:border-border-dark">
                    <tr>
                      <th className="px-6 py-4 font-semibold w-1/4">
                        學生姓名
                      </th>
                      <th className="px-6 py-4 font-semibold w-1/4">
                        課程內容與時間
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        應收 / 實收金額
                      </th>
                      <th className="px-6 py-4 font-semibold">付款狀態</th>
                      <th className="px-6 py-4 font-semibold text-right">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light dark:divide-border-dark bg-white dark:bg-surface-dark">
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold shadow-sm overflow-hidden">
                              {record.student_avatar_url ? (
                                <img
                                  src={record.student_avatar_url}
                                  alt={record.student_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                record.student_name.charAt(0)
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800 dark:text-white">
                                {record.student_name}
                              </span>
                              <span className="text-xs text-text-sub">
                                {record.student_email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800 dark:text-white">
                              {record.course_title}
                            </span>
                            <div
                              className={`flex items-center gap-1.5 mt-1 text-xs ${
                                record.is_overdue
                                  ? "text-red-500 font-medium"
                                  : "text-text-sub"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {record.is_overdue
                                  ? "event_busy"
                                  : "calendar_today"}
                              </span>
                              {record.booking_date}{" "}
                              {record.start_time.slice(0, 5)}
                              {record.is_overdue && " (已過期)"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-bold ${
                                record.status === "completed"
                                  ? "text-text-sub line-through"
                                  : "text-slate-800 dark:text-white"
                              }`}
                            >
                              {formatCurrency(record.price)}
                            </span>
                            <span
                              className={`text-xs ${
                                record.status === "completed"
                                  ? "font-bold text-emerald-600 dark:text-emerald-400"
                                  : "text-text-sub"
                              }`}
                            >
                              實收:{" "}
                              <span
                                className={
                                  record.status === "completed"
                                    ? ""
                                    : "text-slate-400"
                                }
                              >
                                {record.status === "completed"
                                  ? formatCurrency(record.price)
                                  : "NT$ 0"}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative group/status inline-block">
                            {/* Status Badge Logic */}
                            {record.is_overdue ? (
                              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                <span className="size-2 rounded-full bg-red-500 animate-pulse"></span>
                                逾期未繳
                                <span className="material-symbols-outlined text-[16px]">
                                  expand_more
                                </span>
                              </button>
                            ) : record.status === "completed" ||
                              record.status === "confirmed" ? (
                              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">
                                  check
                                </span>
                                已收款
                                <span className="material-symbols-outlined text-[16px]">
                                  expand_more
                                </span>
                              </button>
                            ) : (
                              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50 text-xs font-bold hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                                <span className="size-2 rounded-full bg-orange-500"></span>
                                待收款
                                <span className="material-symbols-outlined text-[16px]">
                                  expand_more
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-2 rounded-lg text-text-sub hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary transition-colors"
                              title="查看"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                visibility
                              </span>
                            </button>
                            {/* Action Button Changes based on status */}
                            {!record.is_overdue &&
                              record.status === "pending" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(record.id, "confirmed")
                                  }
                                  disabled={actionLoading === record.id}
                                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-sm shadow-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {actionLoading === record.id && (
                                    <span className="material-symbols-outlined text-xs animate-spin">
                                      refresh
                                    </span>
                                  )}
                                  記錄收款
                                </button>
                              )}
                            {record.is_overdue && (
                              <button
                                className="p-2 rounded-lg text-text-sub hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary transition-colors"
                                title="發送提醒"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  send
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination (Visual Only for now as endpoint returns all for month) */}
            <div className="p-4 border-t border-border-light dark:border-border-dark flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-xs text-text-sub">
                顯示 {filteredRecords.length} 筆記錄
              </span>
              {/* Simplified pagination since we fetch all for month */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
