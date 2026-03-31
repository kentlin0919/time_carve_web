"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Course } from "@/lib/domain/course/entity";
import { usePublicCourses } from "./usePublicCourses";

const THUMBNAIL_CLASSES = [
  "bg-blue-100",
  "bg-indigo-100",
  "bg-orange-100",
  "bg-teal-100",
  "bg-purple-100",
];

export function useCoursesPageController() {
  const router = useRouter();
  const { courses, loading, error } = usePublicCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const openCourse = useCallback((course: Course) => {
    setSelectedCourse(course);
  }, []);

  const closeCourse = useCallback(() => {
    setSelectedCourse(null);
  }, []);

  const handleBookingClick = useCallback(
    async (courseId: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/auth/login?redirect=/student/booking/create?courseId=${courseId}`);
        return;
      }

      router.push(`/student/booking/create?courseId=${courseId}`);
    },
    [router]
  );

  const getThumbnailClass = useCallback((index: number) => {
    return THUMBNAIL_CLASSES[index % THUMBNAIL_CLASSES.length];
  }, []);

  return {
    courses,
    loading,
    error,
    selectedCourse,
    openCourse,
    closeCourse,
    handleBookingClick,
    getThumbnailClass,
  };
}
