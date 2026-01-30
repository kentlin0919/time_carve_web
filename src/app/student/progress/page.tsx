'use client';

import React, { useEffect, useState } from 'react';
import { getMyCoursesWithProgress } from '@/app/actions/progress';
import { StudentCourseProgress } from '@/lib/domain/progress/types';
import { Course } from '@/lib/domain/course/entity';

type ProgressWithCourse = StudentCourseProgress & { course: Course };

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
  const completedCount = progressList.filter(p => p.progress_percentage === 100 || p.status === 'completed').length;
  const inProgressCount = progressList.filter(p => p.status === 'in_progress' && p.progress_percentage < 100).length;
  const notStartedCount = progressList.filter(p => p.status === 'not_started').length;

  const overallProgress = totalCourses > 0
    ? Math.round(progressList.reduce((acc, curr) => acc + curr.progress_percentage, 0) / totalCourses)
    : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-slate-50 dark:bg-background-dark">
        <div className="text-slate-400">載入學習進度...</div>
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
              學習進度追蹤
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              檢視您的學習歷程，一步步精通牙體雕刻藝術。
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
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">加油！ 🎉</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                {overallProgress > 0 ? "您已經開始了學習旅程，保持這個節奏！" : "準備好開始您的第一個課程了嗎？"}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col">
                  <span className="text-xs text-slate-400 font-bold mb-0.5">已完成</span>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-200">{completedCount} <span className="text-xs font-normal text-slate-400">堂課</span></span>
                </div>
                <div className="px-4 py-2 bg-teal-500/5 dark:bg-teal-500/10 rounded-xl border border-teal-500/10 flex flex-col">
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-bold mb-0.5">進行中</span>
                  <span className="text-lg font-black text-teal-600 dark:text-teal-400">{inProgressCount} <span className="text-xs font-normal text-teal-600/70 dark:text-teal-400/70">主題</span></span>
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col">
                  <span className="text-xs text-slate-400 font-bold mb-0.5">未開始</span>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-200">{notStartedCount} <span className="text-xs font-normal text-slate-400">堂課</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Milestone Card (Static for now as we don't have Milestone logic yet) */}
          <div className="bg-gradient-to-br from-slate-800 to-black dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div>
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <span className="material-symbols-outlined text-[20px]">flag</span>
                <span className="text-xs font-bold uppercase tracking-wider">下一個挑戰</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">持續學習</h3>
              <p className="text-sm text-slate-300 mb-6">每天進步一點點，累積成為大師。</p>
            </div>
          </div>
        </div>

        {/* Timeline Map */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-500">alt_route</span>
            課程地圖
          </h2>
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[27px] md:left-[35px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>

            {progressList.length === 0 && (
              <div className="pl-20 py-8 text-slate-500">
                目前沒有進行中的課程進度。
              </div>
            )}

            {progressList.map(item => {
              const isCompleted = item.progress_percentage === 100 || item.status === 'completed';
              const isActive = item.status === 'in_progress';
              const isLocked = item.status === 'not_started'; // Or define Locked differently

              return (
                <div key={item.id} className="relative pl-20 md:pl-24 mb-10 group">
                  {/* Dot / Icon */}
                  <div className="absolute left-0 top-0 md:left-2 flex flex-col items-center">
                    <div className={`size-14 md:size-16 rounded-full flex items-center justify-center shadow-sm z-10 transition-transform duration-300
                                ${isCompleted
                        ? 'bg-green-50 dark:bg-green-900/20 border-4 border-green-500 text-green-600'
                        : isActive
                          ? 'bg-teal-500 text-white ring-4 ring-white dark:ring-background-dark shadow-[0_0_20px_rgba(45,212,191,0.4)]'
                          : 'bg-slate-100 dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-600 text-slate-400'
                      }`}>
                      <span className="material-symbols-outlined text-[28px] md:text-[32px]">
                        {isCompleted ? 'check' : isActive ? 'edit_square' : 'lock_open'}
                      </span>
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden transition-all duration-300
                            ${isActive ? 'border-2 border-teal-500/20 shadow-lg shadow-teal-500/5' : 'border border-slate-100 dark:border-slate-700 opacity-90 hover:opacity-100'}
                        `}>
                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-4 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isCompleted ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                              : isActive ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}>
                            {item.course.courseType || "課程"}
                          </span>
                          <span className={`text-xs font-bold uppercase tracking-wide ${isActive ? 'text-teal-500 animate-pulse' : 'text-slate-400'}`}>
                            {isCompleted ? '已完成' : isActive ? '進行中' : '未開始'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{item.course.title}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1 min-w-[80px]">
                        <span className={`text-3xl font-black ${isCompleted ? 'text-green-500' : isActive ? 'text-teal-500' : 'text-slate-300'}`}>
                          {item.progress_percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Section Checklist Display */}
                    {item.course.sections && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 opacity-80">
                        {(item.course.sections as any[]).map((section: any) => {
                          const secCompleted = (item.completed_section_ids || []).includes(section.id);
                          return (
                            <div key={section.id} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                              <span className={`material-symbols-outlined text-[18px] ${secCompleted ? 'text-green-500' : 'text-slate-300'}`}>
                                check_circle
                              </span>
                              <span className={secCompleted ? 'text-slate-700 dark:text-slate-300 font-medium' : ''}>{section.title}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {isActive && (
                      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                        <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-teal-500/20 flex items-center gap-2">
                          繼續學習
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    )}
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
