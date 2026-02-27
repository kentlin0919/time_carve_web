"use client";

import React, { useEffect, useState, useCallback } from "react";
import { StatsGrid } from "./_components/StatsGrid";
import { RevenueChart } from "./_components/RevenueChart";
import { CourseDistribution } from "./_components/CourseDistribution";
import { RevenueTable } from "./_components/RevenueTable";
import { AdvancedFilter, AdvancedFilterValues } from "./_components/AdvancedFilter";
import {
  getReportStats,
  getRevenueTrends,
  getCourseRevenueDistribution,
  getTransactionList,
  exportReportData,
} from "@/app/actions/reports";
import {
  ReportStats,
  RevenueTrend,
  CourseRevenueDistribution,
  Transaction,
} from "@/lib/domain/reports/ReportRepository";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [trends, setTrends] = useState<RevenueTrend[]>([]);
  const [distribution, setDistribution] = useState<CourseRevenueDistribution[]>(
    []
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionTotal, setTransactionTotal] = useState(0);

  // Filters
  const [trendRange, setTrendRange] = useState<"6_months" | "year">("6_months");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseTypeFilter, setCourseTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Date Range for stats (default to current month)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterValues>({
    startDate: "",
    endDate: "",
    courseType: "",
    minAmount: "",
    maxAmount: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      // Parallel Fetching
      const [statsData, trendsData, distData, transData] = await Promise.all([
        getReportStats(startDateStr, endDateStr),
        getRevenueTrends(trendRange),
        getCourseRevenueDistribution(),
        getTransactionList({
          searchQuery,
          courseType: courseTypeFilter,
          page,
          pageSize,
        }),
      ]);

      setStats(statsData);
      setTrends(trendsData);
      setDistribution(distData);
      setTransactions(transData.data);
      setTransactionTotal(transData.total);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, trendRange, searchQuery, courseTypeFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search could be better, but basic useEffect works for now.
  // For search input, usually we debounce updates to `searchQuery` state.
  // Here we pass the raw setter to component, which might trigger too many fetches.
  // I'll wrap the setter in a debounce in the Table or here.
  // Use a temporary state for input and effect for debounce?
  // For simplicity, just fetch on generic state change for now.

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const startDate = startOfMonth(selectedDate);
      const endDate = endOfMonth(selectedDate);
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      const csvContent = await exportReportData(startDateStr, endDateStr);
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TimeCarve_Report_${startDateStr}_${endDateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10 transition-all">
        <div className="flex flex-col">
          <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight flex items-center gap-2">
            營收報表
          </h2>
          <p className="text-text-sub dark:text-gray-400 text-sm mt-0.5">
            檢視財務健康狀況與營收趨勢
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative inline-block text-left">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark text-slate-600 dark:text-gray-300 shadow-sm text-sm font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <span className="material-symbols-outlined text-[18px]">
                calendar_month
              </span>
              <span>
                {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月
              </span>
              <span className="material-symbols-outlined text-[18px]">
                expand_more
              </span>
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark rounded-xl shadow-lg z-20 p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(selectedDate.getFullYear() - 1, selectedDate.getMonth())
                      )
                    }
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_left
                    </span>
                  </button>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {selectedDate.getFullYear()}年
                  </span>
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(selectedDate.getFullYear() + 1, selectedDate.getMonth())
                      )
                    }
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDate(new Date(selectedDate.getFullYear(), i));
                        setShowDatePicker(false);
                      }}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${selectedDate.getMonth() === i
                        ? "bg-primary text-white"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-gray-300"
                        }`}
                    >
                      {i + 1}月
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-white dark:bg-slate-800 border border-border-light dark:border-border-dark text-slate-600 dark:text-gray-300 shadow-sm text-sm font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {exporting ? "hourglass_empty" : "download"}
            </span>
            <span>{exporting ? "匯出中..." : "匯出報表"}</span>
          </button>
          <button
            onClick={() => setShowAdvancedFilter(true)}
            className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 text-sm font-bold transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">
              filter_list
            </span>
            <span>進階篩選</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
          {/* Stats Grid */}
          <StatsGrid
            stats={
              stats || {
                totalRevenue: 0,
                totalSessions: 0,
                averageOrderValue: 0,
                activeStudents: 0,
                totalRevenueGrowth: 0,
                totalSessionsGrowth: 0,
                averageOrderValueGrowth: 0,
                activeStudentsGrowth: 0,
              }
            }
            loading={loading}
          />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RevenueChart
              data={trends}
              range={trendRange}
              onRangeChange={setTrendRange}
              loading={loading}
            />
            <CourseDistribution data={distribution} loading={loading} />
          </div>

          {/* Revenue Details Table */}
          <RevenueTable
            transactions={transactions}
            total={transactionTotal}
            page={page}
            pageSize={pageSize}
            loading={loading}
            onPageChange={setPage}
            onSearch={(q) => {
              setPage(1);
              setSearchQuery(q);
            }}
            onFilterType={(t) => {
              setPage(1);
              setCourseTypeFilter(t);
            }}
          />
        </div>
      </div>

      {/* Advanced Filter Modal */}
      <AdvancedFilter
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        initialValues={advancedFilters}
        onApply={(filters) => {
          setAdvancedFilters(filters);
          setCourseTypeFilter(filters.courseType);
          setPage(1);
        }}
      />
    </div>
  );
}
