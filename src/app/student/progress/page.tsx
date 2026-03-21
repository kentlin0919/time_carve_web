'use client';

import React, { useEffect, useState } from 'react';
import { getMyCoursesWithProgress } from '@/app/actions/progress';
import { StudentCourseProgress } from '@/lib/domain/progress/types';
import { Course } from '@/lib/domain/course/entity';
import Link from 'next/link';
import { checkUnpaidBookings } from '@/app/actions/booking';

type ProgressWithCourse = StudentCourseProgress & {
  course: Course;
};

export default function StudentProgressPage() {
  const [loading, setLoading] = useState(true);
  const [progressList, setProgressList] = useState<ProgressWithCourse[]>([]);
  const [hasUnpaidBookings, setHasUnpaidBookings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [data] = await Promise.all([
        getMyCoursesWithProgress(),
      ]);
      // Note: we fetch unpaid check separately if we need studentId context,
      // but student UI can get its own user in server actions
      const unpaidRes = await checkUnpaidBookings("").catch(() => ({ hasUnpaid: false, count: 0 }));
      
      setProgressList(data as any[]); // Temporary cast until we fully remove purchase from the actions
      setHasUnpaidBookings(unpaidRes.count > 0);
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
              追蹤各項課程的學習進度與教案完成狀況。
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
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col text-center min-w-[100px]">
                  <span className="text-xs text-slate-400 font-bold mb-1">參與課程總數</span>
                  <span className="text-2xl font-black text-slate-700 dark:text-slate-200">{totalCourses}</span>
                </div>
                <div className="px-5 py-3 bg-teal-500/5 dark:bg-teal-500/10 rounded-2xl border border-teal-500/10 flex flex-col text-center min-w-[100px]">
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-bold mb-1">進行中</span>
                  <span className="text-2xl font-black text-teal-600 dark:text-teal-400">{inProgressCount}</span>
                </div>
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

        {/* Global Unpaid Warning (If applicable) */}
        {hasUnpaidBookings && (
          <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
            <span className="material-symbols-outlined text-rose-500 mt-0.5">warning</span>
            <div>
              <h3 className="text-rose-800 dark:text-rose-400 font-bold">您有尚未結清的預約款項</h3>
              <p className="text-rose-600 dark:text-rose-500/80 text-sm mt-1">目前有已完成但尚未標記為已收款的預約。在結清前，您將無法建立新的預約。</p>
              <Link href="/student/bookings" className="text-xs font-bold text-rose-700 dark:text-rose-400 underline mt-2 inline-block">前往查看預約紀錄</Link>
            </div>
          </div>
        )}

        {/* Course Cards Grid */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-500">my_location</span>
            我的課程清單
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {progressList.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-400">目前沒有進行中的課程進度。</p>
                <Link href="/student/courses" className="text-primary font-bold mt-4 inline-block">前往挑選課程</Link>
              </div>
            )}

            {progressList.map(item => {
              const isCompleted = item.progress_percentage === 100 || item.status === 'completed';

              return (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-soft group hover:shadow-lg transition-all duration-300 flex flex-col">
                  {/* Top: Course Info */}
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1 w-2/3">
                        <span className={`w-fit text-[10px] font-bold px-2 py-0.5 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-teal-700'
                          }`}>
                          {item.course.courseType === 'online' ? '線上' : '實體'} · {isCompleted ? '已完成' : '學習中'}
                        </span>
                        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors leading-tight line-clamp-2 mt-1">{item.course.title}</h3>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center min-w-[70px] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{item.progress_percentage}%</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">進度</span>
                      </div>
                    </div>

                    {/* Progress Bar (Course Completion) */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]'}`}
                        style={{ width: `${item.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Section Checklist (Compact) */}
                  <div className="px-6 py-4 flex-1 bg-slate-50/50 dark:bg-slate-900/20 border-t border-b border-slate-50 dark:border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">checklist</span> 單元回顧
                    </p>
                    <div className="space-y-2.5">
                      {(item.course.sections as any[] || []).slice(0, 4).map((section: any) => {
                        const secCompleted = (item.completed_section_ids || []).includes(section.id);
                        return (
                          <div key={section.id} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <span className={`material-symbols-outlined text-[16px] mt-px shrink-0 ${secCompleted ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`}>
                              {secCompleted ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={`line-clamp-2 ${secCompleted ? 'line-through opacity-70' : ''}`}>{section.title}</span>
                          </div>
                        )
                      })}
                      {(item.course.sections as any[] || []).length > 4 && (
                        <p className="text-[10px] text-slate-400 font-medium pl-6 pt-1">... 以及其他 {(item.course.sections as any[]).length - 4} 個單元</p>
                      )}
                      {(item.course.sections as any[] || []).length === 0 && (
                        <p className="text-xs text-slate-400 italic pl-1">尚無單元資料</p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="p-6">
                     <Link
                        href={`/student/booking/create?courseId=${item.course.id}`}
                        onClick={(e) => {
                          if (hasUnpaidBookings) e.preventDefault();
                        }}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                          hasUnpaidBookings 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                            : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] shadow-lg shadow-slate-900/10"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
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
