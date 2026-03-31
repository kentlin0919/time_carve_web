"use client";

import Link from "next/link";
import { useStudentProgressController } from "./useStudentProgressController";

export default function StudentProgressPage() {
  const {
    loading,
    progressList,
    hasUnpaidBookings,
    totalCourses,
    inProgressCount,
    overallProgress,
  } = useStudentProgressController();

  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-slate-50 dark:bg-background-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="relative h-full flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-surface-light/80 p-4 backdrop-blur-md dark:border-slate-800 dark:bg-surface-dark/80 md:hidden">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-500/10 p-1.5 text-teal-600 dark:text-teal-400">
            <span className="material-symbols-outlined text-[20px]">
              dentistry
            </span>
          </div>
          <span className="font-bold text-slate-800 dark:text-white">
            牙雕家教
          </span>
        </div>
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div className="container mx-auto flex max-w-[1280px] flex-col gap-8 p-6 pb-24 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white md:text-4xl font-display">
              我的學習概覽
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              追蹤各項課程的學習進度與教案完成狀況。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-soft dark:border-slate-700 dark:bg-slate-800 md:p-8 lg:col-span-2 sm:flex-row">
            <div className="pointer-events-none absolute -mr-16 -mt-16 right-0 top-0 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />
            <div className="relative flex size-40 flex-shrink-0 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-700"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-teal-500 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${overallProgress}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 dark:text-white">
                  {overallProgress}
                  <span className="text-base font-bold text-slate-400">%</span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  總體進度
                </span>
              </div>
            </div>

            <div className="z-10 flex-1 text-center sm:text-left">
              <h2 className="mb-2 text-xl font-bold text-slate-800 dark:text-white">
                繼續加油！ 🎉
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                您的學習旅程正在穩步推進中，請記得定期預約課程以保持手感。
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                <div className="flex min-w-[100px] flex-col rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-center dark:border-slate-700 dark:bg-slate-900">
                  <span className="mb-1 text-xs font-bold text-slate-400">
                    參與課程總數
                  </span>
                  <span className="text-2xl font-black text-slate-700 dark:text-slate-200">
                    {totalCourses}
                  </span>
                </div>
                <div className="flex min-w-[100px] flex-col rounded-2xl border border-teal-500/10 bg-teal-500/5 px-5 py-3 text-center dark:bg-teal-500/10">
                  <span className="mb-1 text-xs font-bold text-teal-600 dark:text-teal-400">
                    進行中
                  </span>
                  <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {inProgressCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-black p-6 text-white shadow-lg dark:from-slate-800 dark:to-slate-900 md:p-8">
            <div className="absolute -mr-10 -mt-10 right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div>
              <div className="mb-4 flex items-center gap-2 opacity-80">
                <span className="material-symbols-outlined text-[20px]">
                  lightbulb
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  學習建議
                </span>
              </div>
              <h3 className="mb-1 text-xl font-bold">定期練習是關鍵</h3>
              <p className="mb-6 text-sm leading-relaxed text-slate-300">
                牙體雕刻需要肌肉記憶，建議每週至少預約一次 2-3 小時的實作課程。
              </p>
            </div>
            <Link
              href="/student/courses"
              className="mt-auto rounded-xl border border-white/10 bg-white/10 py-2 text-center text-sm font-bold transition-all hover:bg-white/20"
            >
              瀏覽更多課程
            </Link>
          </div>
        </div>

        {hasUnpaidBookings && (
          <div className="flex items-start gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm dark:border-rose-900/50 dark:bg-rose-900/10">
            <span className="material-symbols-outlined mt-0.5 text-rose-500">
              warning
            </span>
            <div>
              <h3 className="font-bold text-rose-800 dark:text-rose-400">
                您有尚未結清的預約款項
              </h3>
              <p className="mt-1 text-sm text-rose-600 dark:text-rose-500/80">
                目前有已完成但尚未標記為已收款的預約。在結清前，您將無法建立新的預約。
              </p>
              <Link
                href="/student/bookings"
                className="mt-2 inline-block text-xs font-bold text-rose-700 underline dark:text-rose-400"
              >
                前往查看預約紀錄
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
            <span className="material-symbols-outlined text-teal-500">
              my_location
            </span>
            我的課程清單
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {progressList.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-slate-400">目前沒有進行中的課程進度。</p>
                <Link
                  href="/student/courses"
                  className="mt-4 inline-block font-bold text-primary"
                >
                  前往挑選課程
                </Link>
              </div>
            )}

            {progressList.map((item) => {
              const isCompleted =
                item.progress_percentage === 100 || item.status === "completed";
              const sections = (item.course.sections as Array<{ id: string; title: string }>) || [];
              const completedSections = item.completed_section_ids || [];

              return (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft transition-all duration-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="p-6 pb-4">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex w-2/3 flex-col gap-1">
                        <span
                          className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isCompleted
                              ? "bg-green-100 text-green-700"
                              : "bg-teal-100 text-teal-700"
                          }`}
                        >
                          {item.course.courseType === "online" ? "線上" : "實體"} ·{" "}
                          {isCompleted ? "已完成" : "學習中"}
                        </span>
                        <h3 className="mt-1 line-clamp-2 leading-tight text-slate-800 transition-colors group-hover:text-primary dark:text-white font-bold">
                          {item.course.title}
                        </h3>
                      </div>
                      <div className="flex min-w-[70px] flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-2xl font-black leading-none text-slate-800 dark:text-white">
                          {item.progress_percentage}%
                        </span>
                        <span className="mt-1 text-[9px] font-bold uppercase text-slate-400">
                          進度
                        </span>
                      </div>
                    </div>

                    <div className="mb-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isCompleted
                            ? "bg-green-500"
                            : "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]"
                        }`}
                        style={{ width: `${item.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 border-b border-t border-slate-50 bg-slate-50/50 px-6 py-4 dark:border-slate-800/50 dark:bg-slate-900/20">
                    <p className="mb-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span className="material-symbols-outlined text-[14px]">
                        checklist
                      </span>
                      單元回顧
                    </p>
                    <div className="space-y-2.5">
                      {sections.slice(0, 4).map((section) => {
                        const isSectionCompleted = completedSections.includes(
                          section.id
                        );
                        return (
                          <div
                            key={section.id}
                            className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                          >
                            <span
                              className={`material-symbols-outlined mt-px shrink-0 text-[16px] ${
                                isSectionCompleted
                                  ? "text-green-500"
                                  : "text-slate-300 dark:text-slate-600"
                              }`}
                            >
                              {isSectionCompleted
                                ? "check_circle"
                                : "radio_button_unchecked"}
                            </span>
                            <span
                              className={`line-clamp-2 ${
                                isSectionCompleted ? "line-through opacity-70" : ""
                              }`}
                            >
                              {section.title}
                            </span>
                          </div>
                        );
                      })}
                      {sections.length > 4 && (
                        <p className="pl-6 pt-1 text-[10px] font-medium text-slate-400">
                          ... 以及其他 {sections.length - 4} 個單元
                        </p>
                      )}
                      {sections.length === 0 && (
                        <p className="pl-1 text-xs italic text-slate-400">
                          尚無單元資料
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <Link
                      href={`/student/booking/create?courseId=${item.course.id}`}
                      onClick={(event) => {
                        if (hasUnpaidBookings) {
                          event.preventDefault();
                        }
                      }}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all ${
                        hasUnpaidBookings
                          ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                          : "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:scale-[1.02] dark:bg-white dark:text-slate-900"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        calendar_month
                      </span>
                      {hasUnpaidBookings ? "預約功能已鎖定" : "預約時段"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
