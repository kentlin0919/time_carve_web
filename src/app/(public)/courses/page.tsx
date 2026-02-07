'use client';

import React, { useState } from 'react';
import { usePublicCourses } from './usePublicCourses';
import { Course } from '@/lib/domain/course/entity';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

export default function CoursesPage() {
  const router = useRouter();
  const { courses, loading, error } = usePublicCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleBookingClick = async (courseId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/login?redirect=/student/booking/create?courseId=${courseId}`);
      return;
    }
    
    router.push(`/student/booking/create?courseId=${courseId}`);
  };

  const getThumbnailClass = (index: number) => {
    const classes = ['bg-blue-100', 'bg-indigo-100', 'bg-orange-100', 'bg-teal-100', 'bg-purple-100'];
    return classes[index % classes.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">精選課程方案</h1>
            <p className="text-lg text-text-sub max-w-2xl mx-auto">
                我們提供從入門到進階的完整牙體技術課程，無論您是初學者還是執業牙技師，都能在這裡找到適合的學習資源。
            </p>
        </header>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.length === 0 && !error && (
              <div className="col-span-full text-center py-20 text-slate-500">
                目前尚無公開課程。
              </div>
            )}
            {courses.map((course, index) => (
                <div 
                    key={course.id} 
                    onClick={() => setSelectedCourse(course)}
                    className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-border-light dark:border-border-dark flex flex-col"
                >
                    <div className={`aspect-video relative overflow-hidden flex items-center justify-center ${!course.imageUrl ? getThumbnailClass(index) : ''}`}>
                        {course.imageUrl ? (
                          <Image 
                            src={course.imageUrl} 
                            alt={course.title} 
                            fill 
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-6xl text-white/50">school</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-6 py-2 bg-white/90 text-slate-900 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                                查看詳情
                            </span>
                        </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-md">
                              {course.courseType === 'online' ? '線上' : course.courseType === 'offline' ? '實體' : '混成'}
                            </span>
                            <span className="text-lg font-bold text-slate-800 dark:text-white">
                              {course.price ? `NT$ ${course.price.toLocaleString()}` : '免費'}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                        <p className="text-text-sub text-sm line-clamp-2 mb-4 flex-1">{course.desc}</p>
                        <div className="flex items-center gap-4 text-xs text-text-sub pt-4 border-t border-border-light dark:border-border-dark">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">schedule</span> 
                              {course.durationMinutes ? `${Math.floor(course.durationMinutes / 60)} 小時` : '彈性'}
                            </span>
                            <div className="flex gap-2 ml-auto">
                                {course.tags?.slice(0, 2).map(tag => (
                                    <span key={tag.text} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{tag.text}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedCourse(null)}>
              <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
              >
                  <button 
                    onClick={() => setSelectedCourse(null)}
                    className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black transition-colors z-10"
                  >
                      <span className="material-symbols-outlined">close</span>
                  </button>

                  <div className={`h-64 w-full relative flex items-center justify-center ${!selectedCourse.imageUrl ? getThumbnailClass(courses.indexOf(selectedCourse)) : ''}`}>
                      {selectedCourse.imageUrl ? (
                        <Image src={selectedCourse.imageUrl} alt={selectedCourse.title} fill className="object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-8xl text-white/30">school</span>
                      )}
                      <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/80 to-transparent">
                          <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg mb-2">
                            {selectedCourse.courseType === 'online' ? '線上' : '實體'}
                          </span>
                          <h2 className="text-3xl font-bold text-white">{selectedCourse.title}</h2>
                      </div>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2 space-y-6">
                          <div>
                              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">課程介紹</h3>
                              <p className="text-slate-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedCourse.desc}</p>
                              {selectedCourse.content && (
                                <p className="text-slate-600 dark:text-gray-300 leading-relaxed mt-4 whitespace-pre-wrap">
                                  {selectedCourse.content}
                                </p>
                              )}
                          </div>
                          {selectedCourse.expectedLearningOutcomes && selectedCourse.expectedLearningOutcomes.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">預期學習成果</h3>
                                <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-gray-300">
                                    {selectedCourse.expectedLearningOutcomes.map((outcome, i) => (
                                      <li key={i}>{outcome}</li>
                                    ))}
                                </ul>
                            </div>
                          )}
                      </div>

                      <div className="space-y-6">
                          <div className="p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-border-light dark:border-border-dark space-y-4">
                              <div>
                                  <span className="text-sm text-text-sub">課程費用</span>
                                  <div className="text-3xl font-bold text-primary">
                                    {selectedCourse.price ? `NT$ ${selectedCourse.price.toLocaleString()}` : '免費'}
                                  </div>
                              </div>
                              <div className="space-y-3 pt-4 border-t border-border-light dark:border-border-dark">
                                  <div className="flex items-center justify-between text-sm">
                                      <span className="text-text-sub flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">schedule</span> 總時長</span>
                                      <span className="font-bold text-slate-700 dark:text-gray-200">
                                        {selectedCourse.durationMinutes ? `${Math.floor(selectedCourse.durationMinutes / 60)} 小時` : '彈性'}
                                      </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                      <span className="text-text-sub flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">location_on</span> 上課地點</span>
                                      <span className="font-bold text-slate-700 dark:text-gray-200 text-right">{selectedCourse.location || (selectedCourse.courseType === 'online' ? '線上會議' : '實體教室')}</span>
                                  </div>
                              </div>
                              <button 
                                onClick={() => handleBookingClick(selectedCourse.id)}
                                className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-95"
                              >
                                  立即預約
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}