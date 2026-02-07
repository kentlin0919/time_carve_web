"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { NotificationBell } from "@/components/notification/NotificationBell";
import { SupabaseBookingRepository } from "@/lib/infrastructure/booking/SupabaseBookingRepository";
import { SupabaseCourseRepository } from "@/lib/infrastructure/course/SupabaseCourseRepository";
import { SupabasePortfolioRepository } from "@/lib/infrastructure/portfolio/SupabasePortfolioRepository";
import { SupabaseTeacherRepository } from "@/lib/infrastructure/teacher/SupabaseTeacherRepository";
import { Booking } from "@/lib/domain/booking/entity";
import { Course } from "@/lib/domain/course/entity";
import { Portfolio } from "@/lib/domain/portfolio/entity";
import Link from "next/link";
import { updateBookingStatus } from "@/app/actions/booking";
import { useModal } from "@/components/providers/ModalContext";

export default function TeacherDashboardPage() {
  const { showModal } = useModal();
  const [name, setName] = useState("");
  const [stats, setStats] = useState({
    revenue: 0,
    pendingBookings: 0,
    activeStudents: 0,
    totalCourses: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [todaysCourses, setTodaysCourses] = useState<Booking[]>([]);
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [recentPortfolios, setRecentPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Repositories
      const bookingRepo = new SupabaseBookingRepository();
      const courseRepo = new SupabaseCourseRepository();
      const portfolioRepo = new SupabasePortfolioRepository(supabase);
      const teacherRepo = new SupabaseTeacherRepository();

      // 1. Get User Info & Teacher Info
      const { data: userInfo } = await supabase
        .from("user_info")
        .select("name")
        .eq("id", user.id)
        .single();
      if (userInfo) setName(userInfo.name);

      // Get teacher_id (assuming user.id is teacher_id for now, or fetch from teacher_info)
      // Actually teacher_info.id is strictly linked to user_info.id 1:1 usually, but let's confirm
      const { data: teacherInfo } = await supabase
        .from("teacher_info")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!teacherInfo) return;
      const teacherId = teacherInfo.id;

      // 2. Fetch Stats
      // Date range for this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const bookings = await bookingRepo.getBookings(teacherId, startOfMonth, endOfMonth);
      const students = await teacherRepo.getStudents(teacherId);
      const courses = await courseRepo.getTeacherCourses(teacherId);
      const portfolios = await portfolioRepo.getByTeacherId(teacherId);

      // Calculate Stats
      const revenue = bookings
        .filter(b => b.status === "completed") // Assuming 'completed' status exists/is used
        .reduce((sum, b) => sum + (b.coursePrice || 0), 0);

      const pendingCount = bookings.filter(b => b.status === "pending").length;

      setStats({
        revenue,
        pendingBookings: pendingCount,
        activeStudents: students.length,
        totalCourses: courses.length,
      });

      // 3. Set Lists
      // Only show pending bookings in the "待確認預約" section
      const pendingBookings = bookings
        .filter(b => b.status === 'pending')
        .sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
      setRecentBookings(pendingBookings.slice(0, 5));

      // Filter for Today's Courses
      const todayStr = new Date().toISOString().split('T')[0];
      const todayBookings = bookings
        .filter(b => b.bookingDate === todayStr && b.status !== 'cancelled' && b.status !== 'rejected')
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      setTodaysCourses(todayBookings);

      setActiveCourses(courses.slice(0, 3)); // Just take top 3 for now
      setRecentPortfolios(portfolios.slice(0, 4));

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirm = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "confirmed");
      showModal({
        type: "success",
        title: "預約已確認",
        description: "已成功確認該筆預約。",
        confirmText: "確定",
      });
      fetchData(); // Refresh data
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

  const handleReject = async (bookingId: string) => {
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
          fetchData(); // Refresh data
        } catch (error) {
          console.error("Failed to cancel booking:", error);
        }
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-8 py-4 flex justify-between items-center sticky top-0 z-10 transition-all">
        <div className="flex flex-col">
          <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight flex items-center gap-2">
            早安，{name || "老師"}
            <span className="text-xl">👋</span>
          </h2>
          <p className="text-text-sub dark:text-gray-400 text-sm mt-0.5">
            今日有 <span className="text-primary font-bold">{stats.pendingBookings}</span>{" "}
            筆新預約待處理，<span className="text-primary font-bold">{
              recentBookings.filter(b => b.bookingDate === new Date().toISOString().split('T')[0]).length
            }</span>{" "}
            堂課程即將開始
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <input
              className="pl-10 pr-4 py-2 w-64 rounded-lg border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
              placeholder="搜尋學生、課程..."
              type="text"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub text-[18px]">
              search
            </span>
          </div>
          <div className="h-8 w-px bg-border-light dark:bg-border-dark mx-1 hidden md:block"></div>
          <div className="relative">
            <NotificationBell />
          </div>
          <Link href="/teacher/courses?new=true" className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 text-sm font-bold transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>新增課程</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-8 pb-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-2xl p-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-soft hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">
                  payments
                </span>
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                <p className="text-text-sub dark:text-gray-400 text-sm font-medium">
                  本月營收
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-slate-800 dark:text-white text-3xl font-bold font-display tracking-tight">
                    NT$ {stats.revenue.toLocaleString()}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[14px]">
                      trending_up
                    </span>{" "}
                    --%
                  </span>
                  <span className="text-xs text-text-sub">較上月增長</span>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl p-6 bg-white dark:bg-surface-dark border border-orange-200 dark:border-orange-900/50 shadow-soft hover:shadow-lg transition-all duration-300 ring-2 ring-orange-50 dark:ring-orange-900/10">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-orange-500">
                  pending_actions
                </span>
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                <p className="text-text-sub dark:text-gray-400 text-sm font-medium">
                  待確認預約
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-slate-800 dark:text-white text-3xl font-bold font-display tracking-tight">
                    {stats.pendingBookings}
                  </p>
                  <span className="text-sm text-text-sub font-medium">筆</span>
                </div>
                <div className="mt-2">
                  <span className="text-orange-600 dark:text-orange-400 text-xs font-medium bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-md">
                    需要您的關注
                  </span>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl p-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-soft hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-blue-500">
                  groups
                </span>
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                <p className="text-text-sub dark:text-gray-400 text-sm font-medium">
                  活躍學生
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-slate-800 dark:text-white text-3xl font-bold font-display tracking-tight">
                    {stats.activeStudents}
                  </p>
                  <span className="text-sm text-text-sub font-medium">位</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    +0 新增
                  </span>
                  <span className="text-xs text-text-sub">本週</span>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl p-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-soft hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-purple-500">
                  class
                </span>
              </div>
              <div className="flex flex-col gap-1 relative z-10">
                <p className="text-text-sub dark:text-gray-400 text-sm font-medium">
                  總課程數
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-slate-800 dark:text-white text-3xl font-bold font-display tracking-tight">
                    {stats.totalCourses}
                  </p>
                  <span className="text-sm text-text-sub font-medium">堂</span>
                </div>
                <div className="mt-2">
                  <span className="text-text-sub dark:text-gray-500 text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                    方案上架中
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Recent Bookings */}
            <div className="xl:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-800 dark:text-white text-lg font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center size-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    <span className="material-symbols-outlined text-[20px]">
                      pending_actions
                    </span>
                  </span>
                  待確認預約
                </h3>
                <button className="text-primary text-sm font-medium hover:text-primary-dark transition-colors flex items-center gap-1">
                  查看所有預約{" "}
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </button>
              </div>
              <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark">
                        <th className="pl-6 pr-4 py-4 text-xs font-semibold text-text-sub dark:text-gray-400 uppercase tracking-wider w-1/4">
                          學生
                        </th>
                        <th className="px-4 py-4 text-xs font-semibold text-text-sub dark:text-gray-400 uppercase tracking-wider w-1/4">
                          課程內容
                        </th>
                        <th className="px-4 py-4 text-xs font-semibold text-text-sub dark:text-gray-400 uppercase tracking-wider w-1/4">
                          時間
                        </th>
                        <th className="px-4 py-4 text-xs font-semibold text-text-sub dark:text-gray-400 uppercase tracking-wider w-auto text-right pr-6">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                      {recentBookings.length > 0 ? (
                        recentBookings.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            <td className="pl-6 pr-4 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`size-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm ring-2 ring-white dark:ring-slate-800`}
                                >
                                  {item.studentName?.[0] || "?"}
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                                    {item.studentName}
                                  </p>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 mt-0.5 w-fit`}
                                  >
                                    學員
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-800 dark:text-gray-200">
                                  {item.courseTitle}
                                </span>
                                <span className="text-xs text-text-sub">
                                  {item.courseType}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-slate-800 dark:text-gray-200 text-sm font-medium">
                                  <span className="material-symbols-outlined text-[16px] text-text-sub">
                                    calendar_today
                                  </span>
                                  {item.bookingDate}
                                </div>
                                <div className="flex items-center gap-1.5 text-text-sub text-xs">
                                  <span className="material-symbols-outlined text-[16px]">
                                    schedule
                                  </span>
                                  {item.startTime} - {item.endTime}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right pr-6">
                              <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                {item.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() => handleReject(item.id)}
                                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors tooltip-trigger"
                                      title="婉拒預約"
                                    >
                                      <span className="material-symbols-outlined text-[20px]">
                                        close
                                      </span>
                                    </button>
                                    <button 
                                      onClick={() => handleConfirm(item.id)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-all shadow-sm hover:shadow active:scale-95"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        check
                                      </span>
                                      <span>確認</span>
                                    </button>
                                  </>
                                )}
                                {item.status !== "pending" && (
                                  <span className={`text-xs font-bold px-2 py-1 rounded ${item.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {item.status}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-slate-500 text-sm">
                            尚無近期預約
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-border-light dark:border-border-dark p-3 flex justify-center">
                  <button className="text-text-sub text-xs font-medium hover:text-primary transition-colors">
                    載入更多預約...
                  </button>
                </div>
              </div>
            </div>

            {/* Side Column: Portfolio & Today's Courses */}
            <div className="xl:col-span-1 flex flex-col gap-8">
              {/* Portfolio */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-800 dark:text-white text-lg font-bold flex items-center gap-2">
                    <span className="flex items-center justify-center size-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <span className="material-symbols-outlined text-[20px]">
                        photo_library
                      </span>
                    </span>
                    近期作品集
                  </h3>
                  <button className="text-primary text-sm font-medium hover:text-primary-dark transition-colors">
                    管理
                  </button>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-4 shadow-card">
                  <div className="grid grid-cols-2 gap-3">
                    {recentPortfolios.map((portfolio, idx) => (
                      <Link
                        key={portfolio.id}
                        href={`/teacher/portfolio/${portfolio.id}`}
                        className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 bg-center bg-cover relative group cursor-pointer block"
                        style={{ backgroundImage: `url('${portfolio.cover_image_url || ""}')` }}
                      >
                        {!portfolio.cover_image_url && <div className="absolute inset-0 flex items-center justify-center text-gray-400"><span className="material-symbols-outlined">image</span></div>}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined text-white">
                            edit
                          </span>
                        </div>
                      </Link>
                    ))}
                    <button className="aspect-square rounded-xl border-2 border-dashed border-border-light dark:border-border-dark flex flex-col items-center justify-center gap-2 text-text-sub hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                      <span className="material-symbols-outlined text-3xl">
                        add_a_photo
                      </span>
                      <span className="text-xs font-medium">上傳</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Courses */}
              <div className="flex flex-col gap-4">
                <h3 className="text-slate-800 dark:text-white text-lg font-bold flex items-center gap-2">
                  <span className="flex items-center justify-center size-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <span className="material-symbols-outlined text-[20px]">
                      event_available
                    </span>
                  </span>
                  今日課程
                </h3>
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-1 shadow-card">
                  {todaysCourses.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {todaysCourses.map((booking) => (
                        <div key={booking.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex gap-4 items-center">
                          <div className="flex flex-col items-center justify-center min-w-[3.5rem] h-[3.5rem] rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-border-light dark:border-border-dark">
                            <span className="text-xs font-bold text-text-sub uppercase">
                              {new Date(booking.bookingDate).getMonth() + 1}月
                            </span>
                            <span className="text-xl font-bold text-primary">
                              {new Date(booking.bookingDate).getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-slate-900 dark:text-white font-bold text-sm truncate">
                              {booking.courseTitle || "未知課程"}
                            </h4>
                            <p className="text-text-sub text-xs mt-0.5">
                              {booking.startTime?.slice(0, 5)} - {booking.endTime?.slice(0, 5)} • 學生: {booking.studentName || "未知"}
                            </p>
                          </div>
                          <button className="p-2 text-text-sub hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">
                              videocam
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-sub text-sm">
                      今日無安排課程
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Popular Courses */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-slate-800 dark:text-white text-lg font-bold flex items-center gap-2">
                <span className="flex items-center justify-center size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-[20px]">
                    star
                  </span>
                </span>
                熱門課程方案
              </h3>
              <Link href="/teacher/courses" className="text-primary text-sm font-medium hover:text-primary-dark transition-colors flex items-center gap-1">
                管理所有課程{" "}
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCourses.length > 0 ? (
                activeCourses.map((course) => (
                  <div
                    key={course.id}
                    className="group bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 block cursor-pointer"
                  >
                    <div
                      className="h-44 bg-gray-100 dark:bg-gray-800 bg-center bg-cover relative"
                      style={{ backgroundImage: `url('${course.imageUrl || ""}')` }}
                    >
                      {!course.imageUrl && <div className="absolute inset-0 flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-4xl">image</span></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 dark:bg-black/70 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-slate-800 dark:text-white shadow-sm flex items-center gap-1">
                          <span className={`size-1.5 rounded-full ${course.isActive ? "bg-green-500" : "bg-gray-400"}`}></span>{" "}
                          {course.isActive ? "上架中" : "草稿"}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="text-white font-bold text-xl drop-shadow-md">
                          NT$ {course.price}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-3">
                      <h4 className="text-slate-800 dark:text-white font-bold text-lg line-clamp-1">
                        {course.title}
                      </h4>
                      <p className="text-text-sub dark:text-gray-400 text-sm line-clamp-2 h-10">
                        {course.desc || "暫無描述"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-sub dark:text-gray-500 mt-2 pt-3 border-t border-border-light dark:border-border-dark">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            schedule
                          </span>{" "}
                          {course.durationMinutes || 0} 分鐘
                        </span>
                        <span className="flex items-center gap-1.5 ml-auto text-primary font-medium cursor-pointer">
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>{" "}
                          編輯
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-gray-500">
                  <p>尚無課程，快來建立第一堂課程吧！</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
