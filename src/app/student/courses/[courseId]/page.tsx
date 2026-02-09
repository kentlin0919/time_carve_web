"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStudentCourseDetail } from "../useStudentTeacherCourses";
import StudentCourseDetailView from "./StudentCourseDetailView";
import { getPendingHoursForCourse } from "@/app/actions/progress";

export default function StudentCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = typeof params.courseId === "string" ? params.courseId : "";
  const { course, context, loading, error } = useStudentCourseDetail(courseId);
  const [selectedHours, setSelectedHours] = useState(1);
  const [pendingHours, setPendingHours] = useState(0);

  useEffect(() => {
    if (!course) return;
    const baseHours = Math.max(1, Math.ceil((course.durationMinutes || 60) / 60));
    setSelectedHours(baseHours);

    // Fetch pending hours for this course
    getPendingHoursForCourse(course.id).then(hours => setPendingHours(hours));
  }, [course]);

  const handleBooking = () => {
    if (!course) return;
    router.push(
      `/student/booking/create?courseId=${encodeURIComponent(course.id)}&hours=${selectedHours}`
    );
  };

  const errorMessage = useMemo(() => {
    if (!error) return null;
    return error;
  }, [error]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto relative h-full bg-slate-50 dark:bg-background-dark">
        <div className="container mx-auto max-w-6xl p-6 md:p-10 text-center text-slate-500">
          正在載入課程內容...
        </div>
      </div>
    );
  }

  if (!course || errorMessage) {
    return (
      <div className="flex-1 overflow-y-auto relative h-full bg-slate-50 dark:bg-background-dark">
        <div className="container mx-auto max-w-6xl p-6 md:p-10">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-medium">
            {errorMessage || "找不到課程內容。"}
          </div>
          <div className="mt-6 text-sm text-slate-500">
            <button
              className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold"
              onClick={() => router.push("/student/courses")}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              返回課程列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentCourseDetailView
      course={course}
      context={context}
      selectedHours={selectedHours}
      onHoursChange={setSelectedHours}
      onBooking={handleBooking}
      backHref="/student/courses"
      backLabel="返回課程列表"
      pendingHours={pendingHours}
    />
  );
}
