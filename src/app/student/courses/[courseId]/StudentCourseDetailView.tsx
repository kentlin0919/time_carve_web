"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Course } from "@/lib/domain/course/entity";

const HERO_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCE1Uly6fLjErrYruwnkcru69vTGC1e31xMZOnDuAA81DdY-_uZY9cZnK9-g9UA8Y5mb2g7v_qn7Wz3Hu60VMnNiByPR96fnNueHmxL4b9ohccDKabBJVSlDAsAo1mzvoMH-oVZD95XRhvE4MWDe7sATkVXXF2_Ip5LVOrfvTrFIJtkJSncFEoOCbX-xTdMzjyT5ooeOn6wGFV9tPAcfyLMy5nNyZyEwzUM276O5qZi3XUF1_DGU3e4IfgFUWp9xfBzfiMqCVuGwQo",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBHpcmx5FN0ieyK-KUTHlzpCr7Aj8wyk3XwCcfO9sBG40Fan-DY44DtRxhLT6rnswES6q6B0xREgxnk1ImkFwzDG1AjLCEp0il-_ttTxQZAjLL4AmXamRYBu2Zh6v2QyEZ0GyVpujs4Zkwv3aEJLnYJezfNy4L9DxmcDC3Z5QoMc3eQbRTwtSxoYieRI_nfI5E5ysjpEjZueHWnjExK4sfPdXovbW73WmDh1wuhV8s2zmYq5qKDODTOCJw_efYco-8WOO4DyDdedxA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCE1Uly6fLjErrYruwnkcru69vTGC1e31xMZOnDuAA81DdY-_uZY9cZnK9-g9UA8Y5mb2g7v_qn7Wz3Hu60VMnNiByPR96fnNueHmxL4b9ohccDKabBJVSlDAsAo1mzvoMH-oVZD95XRhvE4MWDe7sATkVXXF2_Ip5LVOrfvTrFIJtkJSncFEoOCbX-xTdMzjyT5ooeOn6wGFV9tPAcfyLMy5nNyZyEwzUM276O5qZi3XUF1_DGU3e4IfgFUWp9xfBzfiMqCVuGwQo",
];

const getHeroImage = (courseId: string) => {
  let hash = 0;
  for (let i = 0; i < courseId.length; i += 1) {
    hash = (hash + courseId.charCodeAt(i) * (i + 1)) % HERO_IMAGES.length;
  }
  return HERO_IMAGES[hash];
};

type CourseContext = {
  teacherName?: string | null;
  teacherTitle?: string | null;
  teacherAvatarUrl?: string | null;
  teacherCode?: string | null;
};

type StudentCourseDetailViewProps = {
  course: Course;
  context?: CourseContext | null;
  onBooking?: () => void;
  backHref: string;
  backLabel: string;
  hideActions?: boolean;
  pendingHours?: number;
  selectedHours?: number;
  onHoursChange?: (hours: number) => void;
};

export default function StudentCourseDetailView({
  course,
  context,
  onBooking,
  backHref,
  backLabel,
  hideActions = false,
  pendingHours = 0,
}: StudentCourseDetailViewProps) {
  const heroImage = useMemo(() => getHeroImage(course.id), [course.id]);

  const outcomes = useMemo(() => {
    if (
      course.expectedLearningOutcomes &&
      course.expectedLearningOutcomes.length > 0
    ) {
      return course.expectedLearningOutcomes;
    }
    if (course.tags && course.tags.length > 0) {
      return course.tags.slice(0, 5).map((tag) => tag.text);
    }
    return [];
  }, [course.expectedLearningOutcomes, course.tags]);

  const sections = course.sections || [];

  return (
    <div className="flex-1 overflow-y-auto relative h-full bg-slate-50 dark:bg-background-dark">
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-1.5 rounded-lg text-primary-dark">
            <span className="material-symbols-outlined text-[20px]">
              dentistry
            </span>
          </div>
          <span className="font-bold text-slate-800 dark:text-white">
            牙雕家教
          </span>
        </div>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div className="container mx-auto max-w-6xl p-4 md:p-8 lg:p-10 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Link
            className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold"
            href={backHref}
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            {backLabel}
          </Link>
          {!hideActions && (
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-[18px]">
                  share
                </span>
                分享
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-[18px]">
                  favorite
                </span>
                收藏
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 flex flex-col gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-secondary/10 text-secondary border border-secondary/20 text-xs font-bold px-3 py-1 rounded-full">
                  課程詳情
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    school
                  </span>
                  {course.courseType}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 dark:text-white leading-tight mb-6">
                {course.title}
              </h1>
              {course.imageUrl && (
                <div className="relative rounded-3xl overflow-hidden aspect-video shadow-lg mb-8 group">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{
                      backgroundImage: `url("${course.imageUrl}")`,
                    }}
                  ></div>
                </div>
              )}
            </div>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
                課程介紹
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base md:text-lg">
                {course.content || course.desc || "尚未提供詳細課程介紹。"}
              </p>
            </section>

            {outcomes.length > 0 && (
              <section className="bg-white dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700 shadow-soft">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  預期學習成果
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {outcomes.map((item) => (
                    <div className="flex items-start gap-3" key={item}>
                      <span className="material-symbols-outlined text-primary mt-0.5">
                        check_circle
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 text-sm md:text-base">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-slate-800 dark:bg-slate-200 rounded-full"></span>
                  詳細教案內容
                </h2>
                <span className="text-sm text-slate-500 font-medium">
                  共 {sections.length || 0} 個單元
                </span>
              </div>

              {sections.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-slate-500 dark:text-slate-400">
                  尚未設定詳細教案內容。
                </div>
              ) : (
                <div className="relative pl-2">
                  {sections.map((section, index) => {
                    const isLast = index === sections.length - 1;
                    const order = String(index + 1).padStart(2, "0");
                    const sectionKey =
                      section.id || `${course.id}-section-${index}`;
                    const hasKeyPoints = Boolean(section.keyPoints?.length);

                    return (
                      <div
                        className={`relative pl-10 ${isLast ? "" : "pb-10"
                          } before:content-[''] before:absolute before:top-8 before:bottom-0 before:left-5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700`}
                        key={sectionKey}
                      >
                        <div className="absolute left-0 top-0 bg-white dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-600 rounded-full size-10 flex items-center justify-center z-10 shadow-sm">
                          <span className="font-bold text-slate-500 dark:text-slate-400 text-sm">
                            {order}
                          </span>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            {section.title}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                            {section.duration && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">
                                  schedule
                                </span>
                                {Math.round(section.duration / 60)} 小時
                              </span>
                            )}
                            {section.isFree && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">
                                  verified
                                </span>
                                免費試看
                              </span>
                            )}
                          </div>
                          {section.learningObjective && (
                            <div className="mt-4">
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                學習目標
                              </span>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                                {section.learningObjective}
                              </p>
                            </div>
                          )}
                          {hasKeyPoints && (
                            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-4">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                單元重點
                              </p>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                                {section.keyPoints?.map((point, pointIndex) => (
                                  <li
                                    key={`${sectionKey}-point-${pointIndex}`}
                                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                                  >
                                    <div className="size-1.5 rounded-full bg-slate-400"></div>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {section.content && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-4">
                              {section.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-8 z-20">
              <div className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-card border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    課程費用
                  </span>
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-bold">
                    名額開放中
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {course.price ? `NT$ ${course.price.toLocaleString()} /小時` : "洽詢"}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-800">
                  <p className="text-center text-xs text-slate-500 mb-1">
                    預約時數可依您的需求彈性選擇
                  </p>
                  <p className="text-center text-xs text-slate-400">
                    {course.price
                      ? "可與老師討論適合的時數與頻率"
                      : "課程費用將於確認後提供"}
                  </p>
                </div>
                {!hideActions && (
                  pendingHours > 0 ? (
                    <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 py-3.5 rounded-xl font-bold text-center mb-4">
                      <span className="material-symbols-outlined text-[18px] mr-2 align-text-bottom">warning</span>
                      尚有未付款時數 ({pendingHours} hr)，請先完成付款
                    </div>
                  ) : (
                    <button
                      className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 mb-4"
                      onClick={onBooking}
                      type="button"
                    >
                      立即預約
                      <span className="material-symbols-outlined text-[20px]">
                        calendar_add_on
                      </span>
                    </button>
                  )
                )}
                <div className="text-center">
                  <a
                    className="text-xs font-bold text-slate-500 hover:text-secondary underline decoration-2 decoration-slate-200 hover:decoration-secondary underline-offset-4 transition-colors"
                    href="#"
                  >
                    查看退費政策
                  </a>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                  授課講師
                </h3>
                <Link
                  href={
                    context?.teacherCode
                      ? `/teachers?teacher_code=${encodeURIComponent(
                        context.teacherCode
                      )}`
                      : "#"
                  }
                  className={`bg-surface-light dark:bg-surface-dark rounded-2xl p-5 border border-slate-200 dark:border-slate-700 flex gap-4 items-start transition-all hover:shadow-md hover:border-primary/30 group ${!context?.teacherCode && "pointer-events-none"
                    }`}
                >
                  <div
                    className="size-14 rounded-full bg-cover bg-center flex-shrink-0 border-2 border-white dark:border-slate-600 shadow-sm"
                    style={{
                      backgroundImage: context?.teacherAvatarUrl
                        ? `url(${context.teacherAvatarUrl})`
                        : "linear-gradient(135deg, #cbd5f5 0%, #93c5fd 100%)",
                    }}
                  ></div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-primary transition-colors">
                      {context?.teacherName || "指導老師"}
                    </h4>
                    <p className="text-xs font-bold text-primary mb-2">
                      {context?.teacherTitle || "專任講師"}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
                      由專屬老師親自帶領，根據學員狀況調整節奏，協助穩定完成目標。
                    </p>
                  </div>
                </Link>
              </div>

              {/* <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  學員評價
                </h3>
                <a
                  className="text-xs font-bold text-primary hover:text-primary-dark"
                  href="#"
                >
                  查看全部
                </a>
              </div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-yellow-400 mb-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        className="material-symbols-outlined text-[16px]"
                        key={`star-${index}`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                    "老師會依照我的進度調整練習節奏，操作步驟變得更清楚，準備考試更有方向。"
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-slate-200"></div>
                    <span className="text-xs font-bold text-slate-500">
                      學員回饋
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-yellow-400 mb-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <span
                        className="material-symbols-outlined text-[16px]"
                        key={`full-star-${index}`}
                      >
                        star
                      </span>
                    ))}
                    <span className="material-symbols-outlined text-[16px]">
                      star_half
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                    "課程節奏剛好，搭配練習時數規劃，準備起來更有效率。"
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-slate-200"></div>
                    <span className="text-xs font-bold text-slate-500">
                      學員回饋
                    </span>
                  </div>
                </div>
              </div>
            </div> */}
            </div>
          </div>
        </div>
      </div>

      {!hideActions && pendingHours === 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 p-4 pb-6 z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">課程費用</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {course.price ? `NT$ ${course.price.toLocaleString()} /小時` : "洽詢"}
            </span>
          </div>
          <button
            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-colors"
            onClick={onBooking}
            type="button"
          >
            立即預約
          </button>
        </div>
      )}
    </div>
  );
}
