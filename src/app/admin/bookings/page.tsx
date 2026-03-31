"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAdminBookingsController } from "./useAdminBookingsController";

export default function AdminBookingsPage() {
  const { currentDate, stats, loading, handlePrevMonth, handleNextMonth } =
    useAdminBookingsController();

  if (loading && !stats) {
    return <div className="p-8 text-center text-text-sub">載入中...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            全平台預約與營收總覽
          </h1>
          <p className="text-text-sub text-sm mt-1">
            監控所有老師的業績表現與平台總流水
          </p>
        </div>
        <div className="flex items-center gap-4 bg-surface-ground border border-border-light dark:border-border-dark p-1 rounded-lg">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <span className="material-symbols-outlined">chevron_left</span>
          </Button>
          <span className="text-sm font-medium w-32 text-center">
            {format(currentDate, "yyyy MMMM")}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <span className="material-symbols-outlined">chevron_right</span>
          </Button>
        </div>
      </div>

      {stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              title="本月預估總營收 (Projected)"
              value={`NT$ ${stats.summary.totalProjectedRevenue.toLocaleString()}`}
              icon="payments"
              color="text-primary"
              bg="bg-primary/10"
            />
            <Card
              title="本月已收款總額 (Received)"
              value={`NT$ ${stats.summary.totalRevenue.toLocaleString()}`}
              icon="check_circle"
              color="text-emerald-500"
              bg="bg-emerald-500/10"
            />
            <Card
              title="本月總預約數"
              value={`${stats.summary.totalBookings} 堂`}
              icon="calendar_month"
              color="text-secondary"
              bg="bg-secondary/10"
            />
          </div>

          {/* Teacher Breakdown Table */}
          <div className="bg-surface-elevated rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
              <h3 className="font-semibold text-text-primary">老師業績排行</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-ground text-text-sub font-medium">
                  <tr>
                    <th className="px-6 py-3">老師名稱</th>
                    <th className="px-6 py-3 text-right">預約堂數</th>
                    <th className="px-6 py-3 text-right">待確認金額</th>
                    <th className="px-6 py-3 text-right">已收款金額</th>
                    <th className="px-6 py-3 text-right">預估總額</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {stats.byTeacher.map((teacher) => (
                    <tr
                      key={teacher.teacherId}
                      className="hover:bg-surface-ground/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-text-primary">
                        {teacher.teacherName}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        {teacher.bookingsCount}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-text-sub">
                        NT$ {teacher.pendingRevenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                        NT$ {teacher.receivedRevenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums font-bold text-text-primary">
                        NT$ {teacher.projectedRevenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {stats.byTeacher.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-text-sub"
                      >
                        本月尚無任何預約紀錄
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  icon,
  color,
  bg,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-surface-elevated p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-sub mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-text-primary">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${bg}`}>
          <span className={`material-symbols-outlined ${color}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
