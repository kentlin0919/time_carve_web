"use client";

import Image from "next/image";
import { useCoursesPageController } from "./useCoursesPageController";

export default function CoursesPage() {
  const {
    courses,
    loading,
    error,
    selectedCourse,
    openCourse,
    closeCourse,
    handleBookingClick,
    getThumbnailClass,
  } = useCoursesPageController();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 pb-20 pt-24 dark:bg-slate-900">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 dark:bg-slate-900">
      <div className="container mx-auto max-w-6xl px-4">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-800 dark:text-white">
            精選課程方案
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-text-sub">
            我們提供從入門到進階的完整牙體技術課程，無論您是初學者還是執業牙技師，都能在這裡找到適合的學習資源。
          </p>
        </header>

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {courses.length === 0 && !error && (
            <div className="col-span-full py-20 text-center text-slate-500">
              目前尚無公開課程。
            </div>
          )}

          {courses.map((course, index) => (
            <div
              key={course.id}
              onClick={() => openCourse(course)}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border-light bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-border-dark dark:bg-slate-800"
            >
              <div
                className={`relative flex aspect-video items-center justify-center overflow-hidden ${
                  !course.imageUrl ? getThumbnailClass(index) : ""
                }`}
              >
                {course.imageUrl ? (
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <span className="material-symbols-outlined text-6xl text-white/50">
                    school
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="transform rounded-full bg-white/90 px-6 py-2 font-bold text-slate-900 shadow-lg transition-all group-hover:translate-y-0">
                    查看詳情
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-start justify-between">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                    {course.courseType === "online"
                      ? "線上"
                      : course.courseType === "offline"
                        ? "實體"
                        : "混成"}
                  </span>
                  <span className="text-lg font-bold text-slate-800 dark:text-white">
                    {course.price ? `NT$ ${course.price.toLocaleString()}` : "免費"}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-white">
                  {course.title}
                </h3>
                <p className="mb-4 flex-1 line-clamp-2 text-sm text-text-sub">
                  {course.desc}
                </p>
                <div className="flex items-center gap-4 border-t border-border-light pt-4 text-xs text-text-sub dark:border-border-dark">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">
                      schedule
                    </span>
                    {course.durationMinutes
                      ? `${Math.floor(course.durationMinutes / 60)} 小時`
                      : "彈性"}
                  </span>
                  <div className="ml-auto flex gap-2">
                    {course.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag.text}
                        className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-700"
                      >
                        {tag.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCourse && (
        <div
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200"
          onClick={closeCourse}
        >
          <div
            className="animate-in zoom-in-95 relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl duration-200 dark:bg-slate-800"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={closeCourse}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/50 p-2 transition-colors hover:bg-white dark:bg-black/50 dark:hover:bg-black"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div
              className={`relative flex h-64 w-full items-center justify-center ${
                !selectedCourse.imageUrl
                  ? getThumbnailClass(courses.indexOf(selectedCourse))
                  : ""
              }`}
            >
              {selectedCourse.imageUrl ? (
                <Image
                  src={selectedCourse.imageUrl}
                  alt={selectedCourse.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-8xl text-white/30">
                  school
                </span>
              )}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-8">
                <span className="mb-2 inline-block rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white">
                  {selectedCourse.courseType === "online" ? "線上" : "實體"}
                </span>
                <h2 className="text-3xl font-bold text-white">
                  {selectedCourse.title}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-3">
              <div className="space-y-6 md:col-span-2">
                <div>
                  <h3 className="mb-3 text-xl font-bold text-slate-800 dark:text-white">
                    課程介紹
                  </h3>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-gray-300">
                    {selectedCourse.desc}
                  </p>
                  {selectedCourse.content && (
                    <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-gray-300">
                      {selectedCourse.content}
                    </p>
                  )}
                </div>

                {selectedCourse.expectedLearningOutcomes &&
                  selectedCourse.expectedLearningOutcomes.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xl font-bold text-slate-800 dark:text-white">
                        預期學習成果
                      </h3>
                      <ul className="list-disc space-y-2 pl-5 text-slate-600 dark:text-gray-300">
                        {selectedCourse.expectedLearningOutcomes.map((outcome, index) => (
                          <li key={index}>{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>

              <div className="space-y-6">
                <div className="space-y-4 rounded-xl border border-border-light bg-slate-50 p-6 dark:border-border-dark dark:bg-slate-700/50">
                  <div>
                    <span className="text-sm text-text-sub">課程費用</span>
                    <div className="text-3xl font-bold text-primary">
                      {selectedCourse.price
                        ? `NT$ ${selectedCourse.price.toLocaleString()}`
                        : "免費"}
                    </div>
                  </div>
                  <div className="space-y-3 border-t border-border-light pt-4 dark:border-border-dark">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-text-sub">
                        <span className="material-symbols-outlined text-[18px]">
                          schedule
                        </span>
                        總時長
                      </span>
                      <span className="font-bold text-slate-700 dark:text-gray-200">
                        {selectedCourse.durationMinutes
                          ? `${Math.floor(selectedCourse.durationMinutes / 60)} 小時`
                          : "彈性"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-text-sub">
                        <span className="material-symbols-outlined text-[18px]">
                          location_on
                        </span>
                        上課地點
                      </span>
                      <span className="text-right font-bold text-slate-700 dark:text-gray-200">
                        {selectedCourse.location ||
                          (selectedCourse.courseType === "online"
                            ? "線上會議"
                            : "實體教室")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleBookingClick(selectedCourse.id)}
                    className="w-full rounded-xl bg-primary py-3 font-bold text-white shadow-lg shadow-primary/25 transition-all active:scale-95 hover:bg-primary-dark"
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
