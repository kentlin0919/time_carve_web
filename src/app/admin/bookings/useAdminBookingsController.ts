"use client";

import { useCallback, useEffect, useState } from "react";
import { endOfMonth, startOfMonth, addMonths, subMonths } from "date-fns";
import { getAdminBookingStats } from "@/app/actions/admin";
import { useModal } from "@/components/providers/ModalContext";

type AdminBookingStats = {
  summary: {
    totalBookings: number;
    totalRevenue: number;
    totalProjectedRevenue: number;
  };
  byTeacher: {
    teacherId: string;
    teacherName: string;
    bookingsCount: number;
    pendingRevenue: number;
    receivedRevenue: number;
    projectedRevenue: number;
  }[];
};

export function useAdminBookingsController() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<AdminBookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { showModal } = useModal();

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const data = await getAdminBookingStats(start, end);
      setStats(data);
    } catch (error) {
      console.error("Failed to load admin stats", error);
      showModal({
        type: "error",
        title: "載入失敗",
        description: "無法載入數據",
        confirmText: "確定",
      });
    } finally {
      setLoading(false);
    }
  }, [currentDate, showModal]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate((previous) => subMonths(previous, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((previous) => addMonths(previous, 1));
  }, []);

  return {
    currentDate,
    stats,
    loading,
    handlePrevMonth,
    handleNextMonth,
  };
}
