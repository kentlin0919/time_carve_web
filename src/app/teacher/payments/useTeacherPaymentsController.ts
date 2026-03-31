"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTeacherPayments,
  type PaymentRecord,
  type PaymentSummary,
} from "@/app/actions/payment";
import { updateBookingStatus } from "@/app/actions/booking";
import { useModal } from "@/components/providers/ModalContext";

type FilterType = "all" | "pending" | "received" | "overdue";

const INITIAL_SUMMARY: PaymentSummary = {
  total_projected: 0,
  total_received: 0,
  pending_count: 0,
  overdue_count: 0,
  overdue_amount: 0,
};

export function useTeacherPaymentsController() {
  const { showModal } = useModal();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>(INITIAL_SUMMARY);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const currentDate = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { records: fetchedRecords, summary: fetchedSummary } =
        await getTeacherPayments(selectedYear, selectedMonth, searchQuery);
      setRecords(fetchedRecords);
      setSummary(fetchedSummary);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      showModal({
        type: "error",
        title: "載入失敗",
        description: "無法載入收款資料，請稍後再試。",
        confirmText: "確定",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedMonth, selectedYear, showModal]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const updateStatus = async (
    bookingId: string,
    newStatus: "confirmed" | "cancelled"
  ) => {
    setActionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      await fetchData();
      showModal({
        type: "success",
        title: newStatus === "confirmed" ? "已記錄收款" : "已取消款項",
        description:
          newStatus === "confirmed"
            ? "該筆款項已更新為已收款。"
            : "該筆款項已取消。",
        confirmText: "確定",
      });
    } catch (error) {
      console.error(error);
      showModal({
        type: "error",
        title: "更新失敗",
        description:
          error instanceof Error ? error.message : "更新收款狀態時發生錯誤",
        confirmText: "確定",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const requestUpdateStatus = (
    bookingId: string,
    newStatus: "confirmed" | "cancelled"
  ) => {
    showModal({
      type: newStatus === "confirmed" ? "success" : "error",
      title: newStatus === "confirmed" ? "記錄收款" : "取消款項",
      description:
        newStatus === "confirmed"
          ? "確定要標記為已收款嗎？"
          : "確定要取消此款項嗎？",
      confirmText: "確定",
      showCancel: true,
      cancelText: "取消",
      onConfirm: async () => {
        await updateStatus(bookingId, newStatus);
      },
    });
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (filter === "all") return true;
      if (filter === "overdue") return record.is_overdue;
      if (filter === "pending")
        return record.status === "pending" && !record.is_overdue;
      if (filter === "received")
        return record.status === "completed" || record.status === "confirmed";
      return true;
    });
  }, [filter, records]);

  const years = useMemo(
    () =>
      Array.from(
        { length: 5 },
        (_, index) => currentDate.getFullYear() - 2 + index
      ),
    [currentDate]
  );
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const formatCurrency = useCallback(
    (amount: number) => `NT$ ${amount.toLocaleString()}`,
    []
  );

  return {
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
  };
}
