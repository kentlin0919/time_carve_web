"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SupabaseBookingRepository } from "@/lib/infrastructure/booking/SupabaseBookingRepository";
import { SupabaseCourseRepository } from "@/lib/infrastructure/course/SupabaseCourseRepository";
import { SupabasePortfolioRepository } from "@/lib/infrastructure/portfolio/SupabasePortfolioRepository";
import { SupabaseTeacherRepository } from "@/lib/infrastructure/teacher/SupabaseTeacherRepository";
import type { Booking } from "@/lib/domain/booking/entity";
import type { Course } from "@/lib/domain/course/entity";
import type { Portfolio } from "@/lib/domain/portfolio/entity";
import { updateBookingStatus } from "@/app/actions/booking";
import { useModal } from "@/components/providers/ModalContext";

type DashboardStats = {
  revenue: number;
  pendingBookings: number;
  activeStudents: number;
  totalCourses: number;
};

const INITIAL_STATS: DashboardStats = {
  revenue: 0,
  pendingBookings: 0,
  activeStudents: 0,
  totalCourses: 0,
};

export function useTeacherDashboardController() {
  const { showModal } = useModal();
  const [name, setName] = useState("");
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [todaysCourses, setTodaysCourses] = useState<Booking[]>([]);
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [recentPortfolios, setRecentPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const bookingRepo = new SupabaseBookingRepository();
      const courseRepo = new SupabaseCourseRepository();
      const portfolioRepo = new SupabasePortfolioRepository(supabase);
      const teacherRepo = new SupabaseTeacherRepository();

      const { data: userInfo } = await supabase
        .from("user_info")
        .select("name")
        .eq("id", user.id)
        .single();

      if (userInfo) {
        setName(userInfo.name);
      }

      const { data: teacherInfo } = await supabase
        .from("teacher_info")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!teacherInfo) {
        return;
      }

      const teacherId = teacherInfo.id;
      const now = new Date();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).toISOString();

      const bookings = await bookingRepo.getBookings(
        teacherId,
        startOfMonth,
        endOfMonth
      );
      const students = await teacherRepo.getStudents(teacherId);
      const courses = await courseRepo.getTeacherCourses(teacherId);
      const portfolios = await portfolioRepo.getByTeacherId(teacherId);

      const revenue = bookings
        .filter((booking) => booking.status === "completed")
        .reduce((sum, booking) => sum + (booking.coursePrice || 0), 0);

      const pendingCount = bookings.filter(
        (booking) => booking.status === "pending"
      ).length;

      setStats({
        revenue,
        pendingBookings: pendingCount,
        activeStudents: students.length,
        totalCourses: courses.length,
      });

      const pendingBookings = bookings
        .filter((booking) => booking.status === "pending")
        .sort(
          (left, right) =>
            new Date(left.bookingDate).getTime() -
            new Date(right.bookingDate).getTime()
        );
      setRecentBookings(pendingBookings.slice(0, 5));

      const today = new Date().toISOString().split("T")[0];
      const todayBookings = bookings
        .filter(
          (booking) =>
            booking.bookingDate === today &&
            booking.status !== "cancelled" &&
            booking.status !== "rejected"
        )
        .sort((left, right) => left.startTime.localeCompare(right.startTime));

      setTodaysCourses(todayBookings);
      setActiveCourses(courses.slice(0, 3));
      setRecentPortfolios(portfolios.slice(0, 4));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const confirmBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "confirmed");
      showModal({
        type: "success",
        title: "預約已確認",
        description: "已成功確認該筆預約。",
        confirmText: "確定",
      });
      await fetchData();
    } catch (error) {
      console.error("Failed to confirm booking:", error);
      showModal({
        type: "error",
        title: "操作失敗",
        description: "無法確認預約，請稍後再試。",
        confirmText: "確定",
      });
    }
  };

  const rejectBooking = (bookingId: string) => {
    showModal({
      type: "error",
      title: "取消預約",
      description: "您確定要取消這筆預約嗎？此動作無法復原。",
      confirmText: "確定取消",
      showCancel: true,
      cancelText: "保留預約",
      onConfirm: async () => {
        try {
          await updateBookingStatus(bookingId, "cancelled");
          await fetchData();
        } catch (error) {
          console.error("Failed to cancel booking:", error);
          showModal({
            type: "error",
            title: "操作失敗",
            description: "無法取消預約，請稍後再試。",
            confirmText: "確定",
          });
        }
      },
    });
  };

  return {
    name,
    stats,
    recentBookings,
    todaysCourses,
    activeCourses,
    recentPortfolios,
    loading,
    confirmBooking,
    rejectBooking,
  };
}
