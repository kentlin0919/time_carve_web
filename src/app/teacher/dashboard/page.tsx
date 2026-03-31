"use client";

import Link from "next/link";
import { NotificationBell } from "@/components/notification/NotificationBell";
import { useTeacherDashboardController } from "./useTeacherDashboardController";

export default function TeacherDashboardPage() {
  const {
    name,
    stats,
    recentBookings,
    todaysCourses,
    activeCourses,
    recentPortfolios,
    loading,
    confirmBooking,
    rejectBooking,
  } = useTeacherDashboardController();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-10 flex w-full items-start justify-between gap-4 border-b border-border-light bg-surface-light/80 px-4 py-4 backdrop-blur-md transition-all dark:border-border-dark dark:bg-surface-dark/80 md:items-center md:px-8">
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="flex items-center gap-2 truncate text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            早安，{name || "老師"}
            <span className="shrink-0 text-xl">👋</span>
          </h2>
          <p className="mt-0.5 line-clamp-2 text-sm text-text-sub dark:text-gray-400 md:line-clamp-none">
            今日有 <span className="font-bold text-primary">{stats.pendingBookings}</span> 筆新預約待處理，
            <span className="font-bold text-primary"> {todaysCourses.length} </span>
            堂課程即將開始
          </p>
        </div>
        <div className="mt-1 flex shrink-0 items-center gap-2 md:mt-0 md:gap-3">
          <div className="relative hidden md:block">
            <input
              className="w-64 rounded-lg border-border-light bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50 dark:border-border-dark dark:bg-slate-800"
              placeholder="搜尋學生、課程..."
              type="text"
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-text-sub">
              search
            </span>
          </div>
          <div className="mx-1 hidden h-8 w-px bg-border-light dark:bg-border-dark md:block" />
          <div className="relative shrink-0">
            <NotificationBell />
          </div>
          <Link
            href="/teacher/courses?new=true"
            className="flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all active:scale-95 hover:bg-primary-dark md:h-10 md:gap-2 md:px-5"
          >
            <span className="material-symbols-outlined text-[18px] md:text-[20px]">
              add
            </span>
            <span className="hidden sm:inline">新增課程</span>
            <span className="inline sm:hidden">新增</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 pb-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="group relative overflow-hidden rounded-2xl border border-border-light bg-surface-light p-6 shadow-soft transition-all duration-300 hover:shadow-lg dark:border-border-dark dark:bg-surface-dark">
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <span className="material-symbols-outlined text-6xl text-primary">
                  payments
                </span>
              </div>
              <div className="relative z-10 flex flex-col gap-1">
                <p className="text-sm font-medium text-text-sub dark:text-gray-400">
                  本月營收
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
                    NT$ {stats.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-orange-200 bg-white p-6 shadow-soft ring-2 ring-orange-50 transition-all duration-300 hover:shadow-lg dark:border-orange-900/50 dark:bg-surface-dark dark:ring-orange-900/10">
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <span className="material-symbols-outlined text-6xl text-orange-500">
                  pending_actions
                </span>
              </div>
              <div className="relative z-10 flex flex-col gap-1">
                <p className="text-sm font-medium text-text-sub dark:text-gray-400">
                  待確認預約
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
                    {stats.pendingBookings}
                  </p>
                  <span className="text-sm font-medium text-text-sub">筆</span>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-light bg-surface-light p-6 shadow-soft transition-all duration-300 hover:shadow-lg dark:border-border-dark dark:bg-surface-dark">
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <span className="material-symbols-outlined text-6xl text-blue-500">
                  groups
                </span>
              </div>
              <div className="relative z-10 flex flex-col gap-1">
                <p className="text-sm font-medium text-text-sub dark:text-gray-400">
                  活躍學生
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
                    {stats.activeStudents}
                  </p>
                  <span className="text-sm font-medium text-text-sub">位</span>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-border-light bg-surface-light p-6 shadow-soft transition-all duration-300 hover:shadow-lg dark:border-border-dark dark:bg-surface-dark">
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <span className="material-symbols-outlined text-6xl text-purple-500">
                  class
                </span>
              </div>
              <div className="relative z-10 flex flex-col gap-1">
                <p className="text-sm font-medium text-text-sub dark:text-gray-400">
                  總課程數
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
                    {stats.totalCourses}
                  </p>
                  <span className="text-sm font-medium text-text-sub">堂</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <div className="xl:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    <span className="material-symbols-outlined text-[20px]">
                      pending_actions
                    </span>
                  </span>
                  待確認預約
                </h3>
                <button className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark">
                  查看所有預約
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_forward
                  </span>
                </button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border-light bg-surface-light shadow-card dark:border-border-dark dark:bg-surface-dark">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border-light bg-slate-50/50 dark:border-border-dark dark:bg-slate-800/50">
                        <th className="w-1/4 py-4 pl-6 pr-4 text-xs font-semibold uppercase tracking-wider text-text-sub dark:text-gray-400">
                          學生
                        </th>
                        <th className="w-1/4 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-text-sub dark:text-gray-400">
                          課程內容
                        </th>
                        <th className="w-1/4 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-text-sub dark:text-gray-400">
                          時間
                        </th>
                        <th className="w-auto py-4 pl-4 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-text-sub dark:text-gray-400">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                      {recentBookings.length > 0 ? (
                        recentBookings.map((item, index) => (
                          <tr
                            key={index}
                            className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-4 pl-6 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 ring-2 ring-white dark:bg-blue-900 dark:text-blue-300 dark:ring-slate-800">
                                  {item.studentName?.[0] || "?"}
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                                    {item.studentName}
                                  </p>
                                  <span className="mt-0.5 inline-flex w-fit items-center rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
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
                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-gray-200">
                                  <span className="material-symbols-outlined text-[16px] text-text-sub">
                                    calendar_today
                                  </span>
                                  {item.bookingDate}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-text-sub">
                                  <span className="material-symbols-outlined text-[16px]">
                                    schedule
                                  </span>
                                  {item.startTime} - {item.endTime}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 pr-6 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                                {item.status === "pending" ? (
                                  <>
                                    <button
                                      onClick={() => rejectBooking(item.id)}
                                      className="tooltip-trigger rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                      title="婉拒預約"
                                    >
                                      <span className="material-symbols-outlined text-[20px]">
                                        close
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => confirmBooking(item.id)}
                                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all active:scale-95 hover:bg-emerald-600 hover:shadow"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        check
                                      </span>
                                      <span>確認</span>
                                    </button>
                                  </>
                                ) : (
                                  <span
                                    className={`rounded px-2 py-1 text-xs font-bold ${
                                      item.status === "confirmed"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                            尚無近期預約
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center border-t border-border-light bg-slate-50 p-3 dark:border-border-dark dark:bg-slate-800/50">
                  <button className="text-xs font-medium text-text-sub transition-colors hover:text-primary">
                    載入更多預約...
                  </button>
                </div>
              </div>
            </div>

            <div className="xl:col-span-1 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <span className="material-symbols-outlined text-[20px]">
                        photo_library
                      </span>
                    </span>
                    近期作品集
                  </h3>
                  <button className="text-sm font-medium text-primary transition-colors hover:text-primary-dark">
                    管理
                  </button>
                </div>
                <div className="rounded-2xl border border-border-light bg-surface-light p-4 shadow-card dark:border-border-dark dark:bg-surface-dark">
                  <div className="grid grid-cols-2 gap-3">
                    {recentPortfolios.map((portfolio) => (
                      <Link
                        key={portfolio.id}
                        href={`/teacher/portfolio/${portfolio.id}`}
                        className="group relative block aspect-square cursor-pointer rounded-xl bg-gray-100 bg-cover bg-center dark:bg-gray-800"
                        style={{
                          backgroundImage: `url('${portfolio.cover_image_url || ""}')`,
                        }}
                      >
                        {!portfolio.cover_image_url && (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="material-symbols-outlined text-white">
                            edit
                          </span>
                        </div>
                      </Link>
                    ))}
                    <button className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-light text-text-sub transition-all hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-border-dark">
                      <span className="material-symbols-outlined text-3xl">
                        add_a_photo
                      </span>
                      <span className="text-xs font-medium">上傳</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    <span className="material-symbols-outlined text-[20px]">
                      event_available
                    </span>
                  </span>
                  今日課程
                </h3>
                <div className="rounded-2xl border border-border-light bg-surface-light p-1 shadow-card dark:border-border-dark dark:bg-surface-dark">
                  {todaysCourses.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {todaysCourses.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                        >
                          <div className="flex h-[3.5rem] min-w-[3.5rem] flex-col items-center justify-center rounded-lg border border-border-light bg-white shadow-sm dark:border-border-dark dark:bg-slate-700">
                            <span className="text-xs font-bold uppercase text-text-sub">
                              {new Date(booking.bookingDate).getMonth() + 1}月
                            </span>
                            <span className="text-xl font-bold text-primary">
                              {new Date(booking.bookingDate).getDate()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {booking.courseTitle || "未知課程"}
                            </h4>
                            <p className="mt-0.5 text-xs text-text-sub">
                              {booking.startTime?.slice(0, 5)} - {booking.endTime?.slice(0, 5)} • 學生:{" "}
                              {booking.studentName || "未知"}
                            </p>
                          </div>
                          {booking.courseType === "online" && (
                            <button className="p-2 text-text-sub transition-colors hover:text-primary">
                              <span className="material-symbols-outlined">
                                videocam
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-text-sub">
                      今日無安排課程
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-[20px]">
                    star
                  </span>
                </span>
                熱門課程方案
              </h3>
              <Link
                href="/teacher/courses"
                className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
              >
                管理所有課程
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeCourses.length > 0 ? (
                activeCourses.map((course) => (
                  <div
                    key={course.id}
                    className="group block cursor-pointer overflow-hidden rounded-2xl border border-border-light bg-surface-light shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-border-dark dark:bg-surface-dark"
                  >
                    <div
                      className="relative h-44 bg-gray-100 bg-cover bg-center dark:bg-gray-800"
                      style={{ backgroundImage: `url('${course.imageUrl || ""}')` }}
                    >
                      {!course.imageUrl && (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-400">
                          <span className="material-symbols-outlined">image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute left-3 top-3">
                        <span className="flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm backdrop-blur dark:bg-black/70 dark:text-white">
                          <span
                            className={`size-1.5 rounded-full ${
                              course.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {course.isActive ? "上架中" : "草稿"}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span className="text-xl font-bold text-white drop-shadow-md">
                          NT$ {course.price}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 p-5">
                      <h4 className="line-clamp-1 text-lg font-bold text-slate-800 dark:text-white">
                        {course.title}
                      </h4>
                      <p className="line-clamp-2 h-10 text-sm text-text-sub dark:text-gray-400">
                        {course.desc || "暫無描述"}
                      </p>
                      <div className="mt-2 flex items-center gap-4 border-t border-border-light pt-3 text-xs text-text-sub dark:border-border-dark dark:text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            schedule
                          </span>
                          {course.durationMinutes || 0} 分鐘
                        </span>
                        <span className="ml-auto flex cursor-pointer items-center gap-1.5 font-medium text-primary">
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>
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
