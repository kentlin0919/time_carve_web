"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useModal } from "@/components/providers/ModalContext";
import type { Course } from "@/lib/domain/course/entity";
import { SupabaseCourseRepository } from "@/lib/infrastructure/course/SupabaseCourseRepository";
import { SupabaseAuthRepository } from "@/lib/infrastructure/auth/SupabaseAuthRepository";

export function useTeacherCoursesController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showModal } = useModal();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<Partial<Course>>({});
  const [showAllFields, setShowAllFields] = useState(false);
  const [expandedContent, setExpandedContent] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    {}
  );

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const authRepo = new SupabaseAuthRepository();
      const courseRepo = new SupabaseCourseRepository(supabase);
      const user = await authRepo.getUser();

      if (user) {
        const data = await courseRepo.getTeacherCourses(user.id);
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setEditForm({
        title: "",
        price: 0,
        priceUnit: "小時",
        desc: "",
        status: "draft",
        sections: [],
      });
      setIsCreating(true);
      setIsEditing(false);
      router.replace("/teacher/courses");
    }
  }, [router, searchParams]);

  useEffect(() => {
    setIsEditing(false);
    setExpandedContent(false);
    setExpandedSections({});
  }, [selectedCourseId]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId]
  );

  const handleEditClick = useCallback(() => {
    if (!selectedCourse) return;
    setEditForm(JSON.parse(JSON.stringify(selectedCourse)) as Partial<Course>);
    setIsEditing(true);
    setIsCreating(false);
  }, [selectedCourse]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setIsCreating(false);
    setEditForm({});
  }, []);

  const handleSaveCourse = useCallback(
    async (formData: Partial<Course>) => {
      setSaving(true);
      try {
        const supabase = createClient();
        const courseRepo = new SupabaseCourseRepository(supabase);

        if (isCreating) {
          const authRepo = new SupabaseAuthRepository();
          const user = await authRepo.getUser();
          if (!user) return;

          const createdCourse = await courseRepo.createCourse({
            teacherId: user.id,
            title: formData.title || "未命名課程",
            desc: formData.desc || "",
            content: formData.content || "",
            courseType: formData.courseType || "1-on-1",
            durationMinutes: formData.durationMinutes || 60,
            price: formData.price || 0,
            imageUrl: formData.imageUrl || null,
            isActive: formData.isActive || false,
            status: formData.status || "draft",
            sections: formData.sections || [],
            tags: formData.tags || [],
            icon: formData.icon || "school",
            iconColor: formData.iconColor || "blue",
            priceUnit: formData.priceUnit || "小時",
          });

          if (createdCourse) {
            setCourses((previous) => [createdCourse, ...previous]);
            setSelectedCourseId(createdCourse.id);
            showModal({
              title: "成功",
              description: "課程建立成功",
              confirmText: "確定",
            });
            setIsCreating(false);
          }
        } else {
          const targetId = formData.id || selectedCourse?.id;
          if (!targetId) return;

          const updatedCourse = await courseRepo.updateCourse(targetId, formData);
          if (updatedCourse) {
            setCourses((previous) =>
              previous.map((course) =>
                course.id === updatedCourse.id ? updatedCourse : course
              )
            );
            showModal({
              title: "成功",
              description: "儲存成功",
              confirmText: "確定",
            });
            setIsEditing(false);
          }
        }
      } catch (error) {
        console.error("Error saving course:", error);
        showModal({
          title: "錯誤",
          description: "儲存失敗，請稍後再試",
          confirmText: "確定",
        });
      } finally {
        setSaving(false);
      }
    },
    [isCreating, selectedCourse?.id, showModal]
  );

  const handleCreateCourse = useCallback(() => {
    setEditForm({
      title: "",
      price: 0,
      priceUnit: "小時",
      desc: "",
      status: "draft",
      sections: [],
    });
    setIsCreating(true);
    setIsEditing(false);
  }, []);

  const handlePreviewCourse = useCallback(
    (courseId: string) => {
      router.push(`/teacher/courses/preview/${courseId}`);
    },
    [router]
  );

  const filteredCourses = useMemo(
    () =>
      courses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (course.desc || "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [courses, searchQuery]
  );

  const formatDateTime = useCallback((value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }, []);

  return {
    courses,
    selectedCourseId,
    setSelectedCourseId,
    searchQuery,
    setSearchQuery,
    isEditing,
    isCreating,
    saving,
    loading,
    editForm,
    showAllFields,
    setShowAllFields,
    expandedContent,
    setExpandedContent,
    expandedSections,
    setExpandedSections,
    selectedCourse,
    handleEditClick,
    handleCancel,
    handleSaveCourse,
    handleCreateCourse,
    handlePreviewCourse,
    filteredCourses,
    formatDateTime,
  };
}
