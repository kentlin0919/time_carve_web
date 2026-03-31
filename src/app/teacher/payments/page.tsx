"use client";

import Image from "next/image";
import { useTeacherPaymentsController } from "./useTeacherPaymentsController";

export default function PaymentManagementPage() {
  const {
    loading,
    actionLoading,
    summary,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    filteredRecords,
    years,
    months,
    formatCurrency,
    requestUpdateStatus,
  } = useTeacherPaymentsController();

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-border-light bg-surface-light/80 px-4 py-4 backdrop-blur-md transition-all dark:border-border-dark dark:bg-surface-dark/80 md:px-8">
        <div className="flex flex-col">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            收款管理
          </h2>
          <p className="mt-0.5 text-sm text-text-sub dark:text-gray-400">
            本月應收 <span className="font-bold text-primary">{formatCurrency(summary.total_projected)}</span>，
            目前尚有 <span className="font-bold text-red-500">{summary.overdue_count}</span> 筆款項逾期
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button className="flex size-9 items-center justify-center rounded-lg border border-border-light bg-white text-text-sub shadow-sm transition-colors hover:text-primary dark:border-border-dark dark:bg-slate-800">
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
            </button>
            <button className="flex size-9 items-center justify-center rounded-lg border border-border-light bg-white text-text-sub shadow-sm transition-colors hover:text-primary dark:border-border-dark dark:bg-slate-800">
              <span className="material-symbols-outlined text-[20px]">
                help
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 pb-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-border-light bg-surface-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
              <div className="z-10 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-sub">
                  本月預估總收入
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-white">
                  {formatCurrency(summary.total_projected)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-green-500">
                  <span className="material-symbols-outlined text-sm">
                    trending_up
                  </span>
                  預估
                </p>
              </div>
              <div className="z-10 flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/30 dark:text-blue-400">
                <span className="material-symbols-outlined">attach_money</span>
              </div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10" />
            </div>

            <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-border-light bg-surface-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
              <div className="z-10 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-sub">
                  實際已收款
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary.total_received)}
                </p>
                <p className="mt-1 text-xs text-text-sub">
                  達成率{" "}
                  {summary.total_projected > 0
                    ? Math.round((summary.total_received / summary.total_projected) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="z-10 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-emerald-50/50 to-transparent dark:from-emerald-900/10" />
            </div>

            <div className="group relative flex items-center justify-between overflow-hidden rounded-2xl border border-border-light bg-surface-light p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark">
              <div className="z-10 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-sub">
                  待收與逾期
                </p>
                <p className="mt-1 text-2xl font-bold text-orange-500 dark:text-orange-400">
                  {formatCurrency(summary.total_projected - summary.total_received)}
                </p>
                <p className="mt-1 text-xs font-medium text-red-500">
                  包含 {summary.overdue_count} 筆逾期 ({formatCurrency(summary.overdue_amount)})
                </p>
              </div>
              <div className="z-10 flex size-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-transform group-hover:scale-110 dark:bg-orange-900/30 dark:text-orange-400">
                <span className="material-symbols-outlined">pending</span>
              </div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-orange-50/50 to-transparent dark:from-orange-900/10" />
            </div>
          </div>

          <div className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-light shadow-card dark:border-border-dark dark:bg-surface-dark">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-border-light bg-slate-50/30 p-5 dark:border-border-dark dark:bg-slate-800/30 lg:flex-row lg:items-center">
              <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center lg:w-auto">
                <div className="relative flex w-full gap-2 sm:w-auto">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-text-sub">
                      calendar_month
                    </span>
                    <select
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(Number(event.target.value))}
                      className="w-32 cursor-pointer appearance-none rounded-lg border-border-light bg-white py-2 pl-10 pr-8 text-sm text-slate-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50 dark:border-border-dark dark:bg-surface-dark dark:text-gray-200"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}年
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-3 top-2.5 text-[18px] text-text-sub">
                      expand_more
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(Number(event.target.value))}
                      className="w-24 cursor-pointer appearance-none rounded-lg border-border-light bg-white py-2 pl-4 pr-8 text-sm text-slate-700 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50 dark:border-border-dark dark:bg-surface-dark dark:text-gray-200"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}月
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-3 top-2.5 text-[18px] text-text-sub">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="flex w-full overflow-x-auto rounded-lg border border-border-light bg-white p-1 dark:border-border-dark dark:bg-slate-800 sm:w-auto">
                  {(["all", "pending", "received", "overdue"] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:flex-none ${
                        filter === value
                          ? value === "overdue"
                            ? "border border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "border border-slate-200 bg-slate-100 text-slate-800 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          : value === "overdue"
                            ? "text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                            : "text-text-sub hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {value === "all"
                        ? "全部"
                        : value === "pending"
                          ? "待收款"
                          : value === "received"
                            ? "已收款"
                            : "逾期"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex w-full items-center gap-3 lg:w-auto">
                <div className="group relative flex-1 lg:flex-none">
                  <input
                    className="w-full rounded-lg border-border-light bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50 dark:border-border-dark dark:bg-surface-dark lg:w-64"
                    placeholder="搜尋學生姓名..."
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-text-sub transition-colors group-focus-within:text-primary">
                    search
                  </span>
                </div>
                <button
                  className="flex size-10 items-center justify-center rounded-lg border border-border-light bg-white text-text-sub shadow-sm transition-colors hover:border-primary hover:text-primary dark:border-border-dark dark:bg-surface-dark"
                  title="匯出報表"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    download
                  </span>
                </button>
              </div>
            </div>

            <div className="min-h-[300px] overflow-x-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center py-20">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                    progress_activity
                  </span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-20 text-text-sub">
                  <span className="material-symbols-outlined mb-2 text-4xl opacity-50">
                    inbox
                  </span>
                  <p>沒有找到相關記錄</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead className="border-b border-border-light bg-slate-50 text-xs uppercase text-text-sub dark:border-border-dark dark:bg-slate-800/50">
                    <tr>
                      <th className="w-1/4 px-6 py-4 font-semibold">學生姓名</th>
                      <th className="w-1/4 px-6 py-4 font-semibold">課程內容與時間</th>
                      <th className="px-6 py-4 font-semibold">金額</th>
                      <th className="px-6 py-4 font-semibold">付款狀態</th>
                      <th className="px-6 py-4 text-right font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light bg-white dark:divide-border-dark dark:bg-surface-dark">
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-bold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                              {record.student_avatar_url ? (
                                <Image
                                  src={record.student_avatar_url}
                                  alt={record.student_name}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                  unoptimized
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
                              className={`mt-1 flex items-center gap-1.5 text-xs ${
                                record.is_overdue ? "font-medium text-red-500" : "text-text-sub"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {record.is_overdue ? "event_busy" : "calendar_today"}
                              </span>
                              {record.booking_date} {record.start_time.slice(0, 5)}
                              {record.is_overdue && " (已過期)"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800 dark:text-white">
                            {formatCurrency(record.price)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {record.is_overdue ? (
                            <button className="flex items-center gap-2 rounded-full border border-red-100 bg-red-50 py-1.5 pl-2 pr-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40">
                              <span className="size-2 animate-pulse rounded-full bg-red-500" />
                              逾期未繳
                            </button>
                          ) : record.status === "completed" || record.status === "confirmed" ? (
                            <button className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 py-1.5 pl-2 pr-3 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40">
                              <span className="material-symbols-outlined text-[16px]">
                                check
                              </span>
                              已收款
                            </button>
                          ) : (
                            <button className="flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 py-1.5 pl-2 pr-3 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/40">
                              <span className="size-2 rounded-full bg-orange-500" />
                              待收款
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                            <button
                              className="rounded-lg p-2 text-text-sub transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-700"
                              title="查看"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                visibility
                              </span>
                            </button>
                            {!record.is_overdue && record.status === "pending" && (
                              <button
                                onClick={() => requestUpdateStatus(record.id, "confirmed")}
                                disabled={actionLoading === record.id}
                                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-primary/30 transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-primary-dark"
                              >
                                {actionLoading === record.id && (
                                  <span className="material-symbols-outlined animate-spin text-xs">
                                    refresh
                                  </span>
                                )}
                                記錄收款
                              </button>
                            )}
                            {record.is_overdue && (
                              <button
                                className="rounded-lg p-2 text-text-sub transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-700"
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

            <div className="flex items-center justify-between border-t border-border-light bg-slate-50/50 p-4 dark:border-border-dark dark:bg-slate-800/30">
              <span className="text-xs text-text-sub">顯示 {filteredRecords.length} 筆記錄</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
