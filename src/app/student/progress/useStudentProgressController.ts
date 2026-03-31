"use client";

import { useEffect, useMemo, useState } from "react";
import { getMyCoursesWithProgress } from "@/app/actions/progress";
import { checkUnpaidBookings } from "@/app/actions/booking";
import type { StudentCourseProgress } from "@/lib/domain/progress/types";
import type { Course } from "@/lib/domain/course/entity";

type ProgressWithCourse = StudentCourseProgress & {
  course: Course;
};

export function useStudentProgressController() {
  const [loading, setLoading] = useState(true);
  const [progressList, setProgressList] = useState<ProgressWithCourse[]>([]);
  const [hasUnpaidBookings, setHasUnpaidBookings] = useState(false);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [data] = await Promise.all([getMyCoursesWithProgress()]);
      const unpaidResult = await checkUnpaidBookings("").catch(() => ({
        hasUnpaid: false,
        count: 0,
      }));

      setProgressList(data as ProgressWithCourse[]);
      setHasUnpaidBookings(unpaidResult.count > 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalCourses = progressList.length;
  const inProgressCount = useMemo(
    () => progressList.filter((item) => item.status === "in_progress").length,
    [progressList]
  );

  const overallProgress = useMemo(() => {
    if (totalCourses === 0) {
      return 0;
    }

    return Math.round(
      progressList.reduce(
        (accumulator, current) => accumulator + current.progress_percentage,
        0
      ) / totalCourses
    );
  }, [progressList, totalCourses]);

  return {
    loading,
    progressList,
    hasUnpaidBookings,
    totalCourses,
    inProgressCount,
    overallProgress,
  };
}
