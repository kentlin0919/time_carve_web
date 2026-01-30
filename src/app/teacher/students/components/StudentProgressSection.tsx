'use client';

import React, { useState, useEffect } from 'react';
import { Course } from '@/lib/domain/course/entity';
import { StudentCourseProgress } from '@/lib/domain/progress/types';
import { getTeacherCourses } from '@/app/actions/teacher';
import { getStudentCourseProgress, updateProgress, initializeProgress } from '@/app/actions/progress';
import { useModal } from '@/components/providers/ModalContext';

interface Props {
    studentId: string;
    teacherId: string; // Used to fetch the teacher's courses
}

export function StudentProgressSection({ studentId, teacherId }: Props) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, StudentCourseProgress>>({});
    const [loading, setLoading] = useState(true);
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
    const { showModal } = useModal();

    // Temporary state for editing notes/progress before specific save or auto-save
    // However, simpler to just update directly or use local state for inputs

    useEffect(() => {
        loadData();
    }, [studentId, teacherId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [coursesData, progressData] = await Promise.all([
                getTeacherCourses(teacherId),
                getStudentCourseProgress(studentId)
            ]);

            setCourses(coursesData as unknown as Course[]); // Cast if needed, assuming action returns compatible type

            const newProgressMap: Record<string, StudentCourseProgress> = {};
            if (progressData) {
                progressData.forEach((p: any) => {
                    newProgressMap[p.course_id] = p;
                });
            }
            setProgressMap(newProgressMap);
        } catch (error) {
            console.error("Failed to load progress data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async (courseId: string, courseTitle: string) => {
        try {
            const newProgress = await initializeProgress(studentId, courseId);
            setProgressMap(prev => ({ ...prev, [courseId]: newProgress as unknown as StudentCourseProgress }));
            setExpandedCourseId(courseId);
            showModal({
                type: 'success',
                title: '已開始追蹤',
                description: `已為《${courseTitle}》建立學習進度紀錄。`,
                confirmText: '好',
            });
        } catch (error) {
            console.error(error);
            showModal({ title: '錯誤', description: '無法初始化進度' });
        }
    };

    const handleUpdate = async (progressId: string, courseId: string, updates: Partial<StudentCourseProgress>) => {
        // Optimistic update
        setProgressMap(prev => {
            const current = prev[courseId];
            if (!current) return prev;
            return { ...prev, [courseId]: { ...current, ...updates } };
        });

        try {
            await updateProgress(progressId, updates);
        } catch (error) {
            console.error("Update failed", error);
            // Revert logic could be complex, for now just log
            showModal({ title: '儲存失敗', description: '網路連線可能有問題' });
        }
    };

    const toggleSectionComplete = (progress: StudentCourseProgress, sectionId: string) => {
        const currentList = progress.completed_section_ids || [];
        const newList = currentList.includes(sectionId)
            ? currentList.filter(id => id !== sectionId)
            : [...currentList, sectionId];

        handleUpdate(progress.id, progress.course_id, { completed_section_ids: newList });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">載入課程進度中...</div>;

    if (courses.length === 0) return <div className="p-8 text-center text-gray-500">您尚未建立任何課程，無法追蹤進度。</div>;

    return (
        <div className="flex flex-col gap-4">
            {courses.map(course => {
                const progress = progressMap[course.id];
                const isExpanded = expandedCourseId === course.id;

                // If course has no progress, show simplified 'Start' card
                if (!progress) {
                    return (
                        <div key={course.id} className="bg-white dark:bg-slate-800 rounded-xl border border-border-light dark:border-border-dark p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined">school</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{course.title}</h4>
                                    <p className="text-xs text-text-sub">尚未開始追蹤</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleInitialize(course.id, course.title)}
                                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors"
                            >
                                開始追蹤
                            </button>
                        </div>
                    );
                }

                // Expanded Edit Card
                return (
                    <div key={course.id} className={`bg-white dark:bg-slate-800 rounded-xl border ${isExpanded ? 'border-primary ring-1 ring-primary/30' : 'border-border-light dark:border-border-dark'} shadow-sm transition-all overflow-hidden`}>
                        {/* Header / Summary */}
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`p-2 rounded-lg ${progress.progress_percentage === 100 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                                    <span className="material-symbols-outlined">
                                        {progress.progress_percentage === 100 ? 'verified' : 'analytics'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{course.title}</h4>
                                        <span className="text-xs font-black text-primary">{progress.progress_percentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progress.progress_percentage}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <span className={`material-symbols-outlined ml-4 text-slate-400 transition-transform ${isExpanded ? 'active:rotate-180' : ''} ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                        </div>

                        {/* Editing Area */}
                        {isExpanded && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-border-light dark:border-border-dark space-y-6 animate-in slide-in-from-top-2">
                                {/* 1. Status & Percentage */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-sub uppercase">學習狀態</label>
                                        <select
                                            value={progress.status}
                                            onChange={(e) => handleUpdate(progress.id, course.id, { status: e.target.value as any })}
                                            className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        >
                                            <option value="not_started">未開始</option>
                                            <option value="in_progress">進行中</option>
                                            <option value="completed">已完成</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-sub uppercase">總進度 ({progress.progress_percentage}%)</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={progress.progress_percentage}
                                            onChange={(e) => handleUpdate(progress.id, course.id, { progress_percentage: parseInt(e.target.value) })}
                                            className="w-full accent-primary h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* 2. Section Checklist */}
                                {course.sections && course.sections.length > 0 && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-text-sub uppercase flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">checklist</span>
                                            章節完成檢核
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {course.sections.map(section => {
                                                const isCompleted = (progress.completed_section_ids || []).includes(section.id);
                                                return (
                                                    <div
                                                        key={section.id}
                                                        onClick={() => toggleSectionComplete(progress, section.id)}
                                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isCompleted
                                                                ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
                                                                : 'bg-white dark:bg-slate-700 border-border-light dark:border-border-dark hover:border-primary/50'
                                                            }`}
                                                    >
                                                        <div className={`size-5 rounded flex items-center justify-center border ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-500'}`}>
                                                            {isCompleted && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                                                        </div>
                                                        <span className={`text-sm ${isCompleted ? 'text-green-700 dark:text-green-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                                                            {section.title}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Teacher Notes */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-sub uppercase flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">edit_note</span>
                                        教學筆記 (僅教師可見)
                                    </label>
                                    <textarea
                                        value={progress.teacher_notes || ''}
                                        onChange={(e) => handleUpdate(progress.id, course.id, { teacher_notes: e.target.value })}
                                        className="w-full px-3 py-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-y min-h-[100px]"
                                        placeholder="紀錄學生的學習狀況、弱點或需要加強的部分..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
