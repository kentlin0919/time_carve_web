import React, { useState } from "react";
import { Transaction } from "@/lib/domain/reports/ReportRepository"; // Ensure this matches path
import { getTransactionDetail, ReportTransactionDetail } from "@/app/actions/reports";
import { useModal } from "@/components/providers/ModalContext";

interface RevenueTableProps {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onFilterType: (type: string) => void;
}

export function RevenueTable({
  transactions,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  onSearch,
  onFilterType,
}: RevenueTableProps) {
  const totalPages = Math.ceil(total / pageSize);
  const { showModal } = useModal();
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(val);
  const formatDate = (dateStr: string) => {
    // dateStr is YYYY-MM-DD (avoid timezone shifts)
    const safe = dateStr?.slice(0, 10);
    if (safe && /^\d{4}-\d{2}-\d{2}$/.test(safe)) return safe;
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatTimeRange = (start?: string, end?: string) => {
    const toHHmm = (val?: string) => {
      if (!val) return "--:--";
      return val.includes("T") ? new Date(val).toISOString().slice(11, 16) : val.slice(0, 5);
    };
    return `${toHHmm(start)} - ${toHHmm(end)}`;
  };

  const renderDetailContent = (detail: ReportTransactionDetail) => {
    const sections = Array.isArray(detail.course.sections) ? detail.course.sections : [];
    const completedIds = detail.progress?.completedSectionIds || [];
    const progressPercent =
      detail.progress?.progressPercentage ??
      (sections.length > 0 ? Math.round((completedIds.length / sections.length) * 100) : 0);

    return (
      <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-6">
        {/* Student */}
        <div className="flex items-center gap-3">
          {detail.student.avatarUrl ? (
            <img
              src={detail.student.avatarUrl}
              alt={detail.student.name}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-sm font-bold">
              {detail.student.name?.[0]}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">
              {detail.student.name}
            </p>
            <p className="text-xs text-text-sub">學生</p>
          </div>
        </div>

        {/* Booking Record */}
        <div className="rounded-xl border border-border-light dark:border-border-dark bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800 dark:text-white">課程紀錄</p>
            <span className="text-xs px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {detail.booking.statusLabel || detail.booking.statusKey || "未知狀態"}
            </span>
          </div>
          <div className="text-sm text-slate-700 dark:text-gray-200">
            <div>日期：{formatDate(detail.booking.bookingDate)}</div>
            <div>時間：{formatTimeRange(detail.booking.startTime, detail.booking.endTime)}</div>
            <div>實收金額：{formatCurrency(Number(detail.booking.price || 0))}</div>
            {detail.booking.paidAt && (
              <div>付款時間：{formatDate(detail.booking.paidAt)}</div>
            )}
            {detail.booking.notes && (
              <div className="mt-1 text-text-sub">備註：{detail.booking.notes}</div>
            )}
          </div>
        </div>

        {/* Course Details */}
        <div className="rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 p-4 space-y-2">
          <p className="text-sm font-bold text-slate-800 dark:text-white">課程詳情</p>
          <div className="text-sm text-slate-700 dark:text-gray-200 space-y-1">
            <div>課程名稱：{detail.course.title}</div>
            <div>類型：{detail.course.courseType}</div>
            <div>時長：{detail.course.durationMinutes || 0} 分鐘</div>
            <div>定價：{formatCurrency(Number(detail.course.price || 0))}</div>
            {detail.course.location && <div>地點：{detail.course.location}</div>}
          </div>
          {detail.course.description && (
            <div className="text-sm text-text-sub">簡介：{detail.course.description}</div>
          )}
          {detail.course.expectedLearningOutcomes?.length ? (
            <div className="text-sm text-slate-700 dark:text-gray-200">
              學習成果：
              <div className="flex flex-wrap gap-2 mt-2">
                {detail.course.expectedLearningOutcomes.map((item, idx) => (
                  <span
                    key={`${item}-${idx}`}
                    className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Learning Map */}
        <div className="rounded-xl border border-border-light dark:border-border-dark bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800 dark:text-white">學習地圖</p>
            <span className="text-xs font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {sections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((section: any, idx: number) => {
                const id = section.id ?? String(idx);
                const title = section.title ?? section.name ?? `章節 ${idx + 1}`;
                const completed = completedIds.includes(id);
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
                      completed
                        ? "bg-emerald-50/70 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300"
                        : "bg-white dark:bg-slate-700 border-border-light dark:border-border-dark text-slate-700 dark:text-gray-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {completed ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span className="truncate">{title}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-sub">此課程尚未設定章節。</p>
          )}
          {!detail.progress && (
            <p className="text-xs text-text-sub">尚未建立學生進度紀錄。</p>
          )}
        </div>
      </div>
    );
  };

  const handleViewDetail = async (transactionId: string) => {
    try {
      setDetailLoadingId(transactionId);
      showModal({
        title: "載入中...",
        description: "正在取得課程與學習紀錄",
        type: "info",
        size: "lg",
        confirmText: "關閉",
        children: (
          <div className="text-sm text-text-sub text-center py-6">資料載入中</div>
        ),
      });
      const detail = await getTransactionDetail(transactionId);
      showModal({
        title: "課程詳情",
        description: "學生課程紀錄與學習地圖",
        type: "info",
        size: "lg",
        confirmText: "關閉",
        children: renderDetailContent(detail),
      });
    } catch (error) {
      console.error(error);
      showModal({
        type: "error",
        title: "載入失敗",
        description: "無法取得詳細資訊，請稍後再試",
        confirmText: "好",
      });
    } finally {
      setDetailLoadingId(null);
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card flex flex-col overflow-hidden">
      <div className="p-5 border-b border-border-light dark:border-border-dark flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-50/30 dark:bg-slate-800/30">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-text-sub">
            list_alt
          </span>
          營收明細列表
        </h3>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-64">
            <input
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full rounded-lg border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
              placeholder="搜尋學生、課程..."
              type="text"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-text-sub group-focus-within:text-primary text-[18px] transition-colors">
              search
            </span>
          </div>
          <select
            onChange={(e) => onFilterType(e.target.value)}
            className="pl-3 pr-8 py-2 w-full sm:w-auto rounded-lg border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none appearance-none cursor-pointer text-slate-700 dark:text-gray-200"
          >
            <option value="">所有課程類型</option>
            {/* Options should ideally be dynamic, but for now hardcode generic types or fetch */}
            <option value="general">一般課程</option>
            <option value="package">套裝課程</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-text-sub uppercase border-b border-border-light dark:border-border-dark">
            <tr>
              <th className="px-6 py-4 font-semibold">入帳日期</th>
              <th className="px-6 py-4 font-semibold">學生姓名</th>
              <th className="px-6 py-4 font-semibold">課程名稱</th>
              <th className="px-6 py-4 font-semibold">課程類型</th>
              <th className="px-6 py-4 font-semibold text-right">實收金額</th>
              <th className="px-6 py-4 font-semibold text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark bg-white dark:bg-surface-dark">
            {loading ? (
              // Skeleton rows
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-48"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div>
                  </td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-text-sub"
                >
                  暫無交易紀錄
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-6 py-4 text-sm text-text-sub">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {t.studentAvatar ? (
                        <img
                          src={t.studentAvatar}
                          alt={t.studentName}
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                          {t.studentName?.[0]}
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-800 dark:text-white">
                        {t.studentName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-gray-300">
                    {t.courseTitle}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">
                      {t.courseType || "一般"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleViewDetail(t.id)}
                      className="text-text-sub hover:text-primary transition-colors disabled:opacity-50"
                      disabled={detailLoadingId === t.id}
                      aria-label="查看詳情"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        visibility
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-border-light dark:border-border-dark flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
        <span className="text-xs text-text-sub">
          顯示最新 {transactions.length} 筆，共 {total} 筆交易
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="size-8 flex items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-text-sub hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_left
            </span>
          </button>

          <span className="text-sm text-text-sub px-2">
            Page {page} of {Math.max(1, totalPages)}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="size-8 flex items-center justify-center rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-text-sub hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
