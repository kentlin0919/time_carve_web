'use client';

import React, { useEffect, useState } from 'react';
import { getMyCoursesWithProgress } from '@/app/actions/progress';
import { StudentCourseProgress } from '@/lib/domain/progress/types';
import { Course } from '@/lib/domain/course/entity';
import Link from 'next/link';

type ProgressWithCourse = StudentCourseProgress & {
  course: Course;
  purchase: {
    totalHours: number;
    remainingHours: number;
    pendingHours: number;
    id: string;
  } | null;
};

export default function StudentProgressPage() {
  const [loading, setLoading] = useState(true);
  const [progressList, setProgressList] = useState<ProgressWithCourse[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getMyCoursesWithProgress();
      setProgressList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Stats Calculation
  const totalCourses = progressList.length;
  const inProgressCount = progressList.filter(p => p.status === 'in_progress').length;

  const overallProgress = totalCourses > 0
    ? Math.round(progressList.reduce((acc, curr) => acc + curr.progress_percentage, 0) / totalCourses)
    : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-slate-50 dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto relative h-full bg-slate-50 dark:bg-background-dark">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/10 p-1.5 rounded-lg text-teal-600 dark:text-teal-400">
            <span className="material-symbols-outlined text-[20px]">dentistry</span>
          </div>
          <span className="font-bold text-slate-800 dark:text-white">牙雕家教</span>
        </div>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div className="container mx-auto max-w-[1280px] p-6 md:p-10 flex flex-col gap-8 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-display font-black leading-tight tracking-tight mb-2">
              我的學習概覽
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              追蹤各項課程的學習進度與剩餘可用時數。
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Progress Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-soft flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

            {/* Circular Progress */}
            <div className="relative size-40 flex-shrink-0">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                <path className="text-teal-500 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor"
                  strokeDasharray={`${overallProgress}, 100`}
                  strokeLinecap="round" strokeWidth="3"></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 dark:text-white">{overallProgress}<span className="text-base font-bold text-slate-400">%</span></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">總體進度</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left z-10">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">繼續加油！ 🎉</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                您的學習旅程正在穩步推進中，請記得定期預約課程以保持手感。
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col text-center min-w-[80px]">
                  <span className="text-xs text-slate-400 font-bold mb-0.5">總方案數</span>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-200">{totalCourses}</span>
                </div>
                <div className="px-4 py-2 bg-teal-500/5 dark:bg-teal-500/10 rounded-xl border border-teal-500/10 flex flex-col text-center min-w-[80px]">
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-bold mb-0.5">進行中</span>
                  <span className="text-lg font-black text-teal-600 dark:text-teal-400">{inProgressCount}</span>
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col text-center min-w-[80px]">
                  <span className="text-xs text-slate-400 font-bold mb-0.5">剩餘總時數</span>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-200">
                    {progressList.reduce((acc, curr) => acc + (curr.purchase?.remainingHours || 0), 0)} hr
                  </span>
                </div>
                {progressList.reduce((acc, curr) => acc + (curr.purchase?.pendingHours || 0), 0) > 0 && (
                  <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 flex flex-col text-center min-w-[80px]">
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-0.5">待付款時數</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {progressList.reduce((acc, curr) => acc + (curr.purchase?.pendingHours || 0), 0)} hr
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-black dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div>
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                <span className="text-xs font-bold uppercase tracking-wider">學習建議</span>
              </div>
              <h3 className="text-xl font-bold mb-1">定期練習是關鍵</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">牙體雕刻需要肌肉記憶，建議每週至少預約一次 2-3 小時的實作課程。</p>
            </div>
            <Link href="/student/courses" className="mt-auto bg-white/10 hover:bg-white/20 py-2 rounded-xl text-center text-sm font-bold transition-all border border-white/10">
              瀏覽更多課程
            </Link>
          </div>
        </div>

        {/* Course Cards Grid */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-500">my_location</span>
            我的課程方案
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {progressList.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-400">目前沒有進行中的課程進度。</p>
                <Link href="/student/courses" className="text-primary font-bold mt-4 inline-block">前往挑選課程</Link>
              </div>
            )}

            {progressList.map(item => {
              const isCompleted = item.progress_percentage === 100 || item.status === 'completed';
              const remaining = item.purchase?.remainingHours || 0;
              const pending = item.purchase?.pendingHours || 0; // New field
              const total = item.purchase?.totalHours || 0;     // Fallback to 0 if null

              return (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-soft group hover:shadow-lg transition-all duration-300 flex flex-col">
                  {/* Top: Course Info */}
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit text-[10px] font-bold px-2 py-0.5 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-teal-700'
                          }`}>
                          {item.course.courseType === 'online' ? '線上' : '實體'} · {isCompleted ? '已完成' : '學習中'}
                        </span>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors">{item.course.title}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{item.progress_percentage}%</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">教案進度</p>
                      </div>
                    </div>

                    {/* Progress Bar (Course Completion) */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-6">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]'}`}
                        style={{ width: `${item.progress_percentage}%` }}
                      ></div>
                    </div>

                    {/* Middle: Hours Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">購買總時數</span>
                        <span className="text-lg font-black text-slate-700 dark:text-slate-200">{total} <span className="text-xs font-normal">hr</span></span>
                      </div>
                      <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">剩餘時數</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-lg font-black ${remaining > 0 ? 'text-teal-500' : 'text-rose-500'}`}>{remaining} <span className="text-xs font-normal">hr</span></span>
                        </div>
                        {pending > 0 && (
                          <div className="mt-1 inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 px-2 py-0.5 rounded-md w-fit">
                            <span className="material-symbols-outlined text-[14px] text-amber-600 dark:text-amber-400">pending</span>
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">待付款: {pending} hr</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Checklist (Compact) */}
                  <div className="px-6 py-4 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">單元進度回顧</p>
                    <div className="space-y-2">
                      {(item.course.sections as any[] || []).slice(0, 3).map((section: any) => {
                        const secCompleted = (item.completed_section_ids || []).includes(section.id);
                        return (
                          <div key={section.id} className="flex items-center gap-2 text-xs text-slate-500">
                            <span className={`material-symbols-outlined text-[16px] ${secCompleted ? 'text-green-500' : 'text-slate-300'}`}>
                              {secCompleted ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className="truncate">{section.title}</span>
                          </div>
                        )
                      })}
                      {(item.course.sections as any[] || []).length > 3 && (
                        <p className="text-[10px] text-slate-400 pl-6">... 以及其他 {(item.course.sections as any[]).length - 3} 個單元</p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="p-6 pt-0 mt-auto">
                    {pending > 0 ? (
                      <div className="w-full py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold text-sm flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                        尚未付款 ({pending} hr)
                      </div>
                    ) : (
                      <Link
                        href={`/student/booking/create?courseId=${item.course.id}`}
                        className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] shadow-lg"
                      >
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        預約時段
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Removed Custom Purchase Modal */}
    </div>
  );
}
