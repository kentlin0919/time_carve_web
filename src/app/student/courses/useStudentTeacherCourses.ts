"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SupabaseAuthRepository } from "@/lib/infrastructure/auth/SupabaseAuthRepository";
import { SupabaseCourseRepository } from "@/lib/infrastructure/course/SupabaseCourseRepository";
import { Course } from "@/lib/domain/course/entity";

type StudentTeacherContext = {
  studentId: string;
  teacherId: string;
  teacherCode: string;
  teacherName?: string | null;
  teacherTitle?: string | null;
  teacherAvatarUrl?: string | null;
};

const loadStudentTeacherContext = async (): Promise<StudentTeacherContext | null> => {
  const authRepo = new SupabaseAuthRepository();
  const user = await authRepo.getUser();

  if (!user) return null;

  const { data: studentInfo, error: studentError } = await supabase
    .from("student_info")
    .select("teacher_code")
    .eq("id", user.id)
    .maybeSingle();

  if (studentError || !studentInfo?.teacher_code) return null;

  const { data: publicProfileData } = await supabase.rpc(
    "get_public_teacher_profile",
    { code: studentInfo.teacher_code }
  );

  const { data: teacherInfo, error: teacherError } = await supabase
    .from("teacher_info")
    .select("id, teacher_code")
    .eq("teacher_code", studentInfo.teacher_code)
    .maybeSingle();

  if (teacherError || !teacherInfo?.id) return null;

  const profile = Array.isArray(publicProfileData) ? publicProfileData[0] : publicProfileData;

  return {
    studentId: user.id,
    teacherId: teacherInfo.id,
    teacherCode: teacherInfo.teacher_code,
    teacherName: profile?.name || null,
    teacherTitle: profile?.title || null,
    teacherAvatarUrl: profile?.avatar_url || null,
  };
};

export const useStudentTeacherCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<StudentTeacherContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ctx = await loadStudentTeacherContext();
      if (!ctx) {
        setError("尚未綁定老師或無法取得課程資料。");
        setCourses([]);
        setContext(null);
        return;
      }

      const courseRepo = new SupabaseCourseRepository();
      const data = await courseRepo.getTeacherCourses(ctx.teacherId);
      setCourses(data);
      setContext(ctx);
    } catch (err) {
      console.error("Error loading student courses:", err);
      setError("載入課程失敗，請稍後再試。");
      setCourses([]);
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return {
    courses,
    context,
    loading,
    error,
    reload: loadCourses,
  };
};

export const useStudentCourseDetail = (courseId?: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [context, setContext] = useState<StudentTeacherContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) {
        setLoading(false);
        setCourse(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const ctx = await loadStudentTeacherContext();
        if (!ctx) {
          setError("尚未綁定老師或無法取得課程資料。");
          setCourse(null);
          setContext(null);
          return;
        }

        const courseRepo = new SupabaseCourseRepository(supabase);
        const data = await courseRepo.getCourse(courseId);

        if (!data || data.teacherId !== ctx.teacherId) {
          setError("找不到此課程或您沒有權限查看。");
          setCourse(null);
          setContext(ctx);
          return;
        }

        setCourse(data);
        setContext(ctx);
      } catch (err) {
        console.error("Error loading course detail:", err);
        setError("載入課程失敗，請稍後再試。");
        setCourse(null);
        setContext(null);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  return {
    course,
    context,
    loading,
    error,
  };
};
