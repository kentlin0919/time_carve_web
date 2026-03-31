"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/providers/ModalContext";

type Tag = {
  id: string;
  name: string;
  teacher_id: string | null;
  created_at: string;
  teacher_info?: {
    user_info: {
      name: string;
    } | null;
  } | null;
};

type TeacherOption = {
  id: string;
  name: string;
};

type TeacherRow = {
  id: string;
  user_info: {
    name: string;
  } | null;
};

export function useAdminTagsController() {
  const { showModal } = useModal();
  const [tags, setTags] = useState<Tag[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTag, setCurrentTag] = useState<Partial<Tag>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([fetchTags(), fetchTeachers()]);
  }, []);

  const fetchTeachers = async () => {
    const { data, error } = await supabase.from("teacher_info").select(`
        id,
        user_info!inner (
          name
        )
      `);

    if (error) {
      console.error("Error fetching teachers:", error);
      return;
    }

    const formattedTeachers = (data as unknown as TeacherRow[]).map((teacher) => ({
      id: teacher.id,
      name: teacher.user_info?.name || "Unknown Teacher",
    }));
    setTeachers(formattedTeachers);
  };

  const fetchTags = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tags")
      .select(
        `
        *,
        teacher_info (
          user_info (
            name
          )
        )
      `
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching tags:", error);
    } else {
      setTags((data as unknown as Tag[]) ?? []);
    }

    setLoading(false);
  };

  const openCreateModal = () => {
    setCurrentTag({ teacher_id: null });
    setIsEditing(true);
    setError(null);
  };

  const openEditModal = (tag: Tag) => {
    setCurrentTag(tag);
    setIsEditing(true);
    setError(null);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setCurrentTag({});
  };

  const saveTag = async () => {
    setError(null);

    if (!currentTag.name?.trim()) {
      setError("請填寫標籤名稱");
      return;
    }

    try {
      if (currentTag.id) {
        const { error } = await supabase
          .from("tags")
          .update({
            name: currentTag.name,
            teacher_id: currentTag.teacher_id || null,
          })
          .eq("id", currentTag.id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("tags").insert({
          name: currentTag.name,
          teacher_id: currentTag.teacher_id || null,
        });

        if (error) {
          throw error;
        }
      }

      closeEditModal();
      await fetchTags();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "儲存失敗");
    }
  };

  const deleteTag = async (id: string) => {
    if (!window.confirm("確定要刪除此標籤嗎？")) {
      return;
    }

    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) {
      showModal({
        type: "error",
        title: "刪除失敗",
        description: error.message,
        confirmText: "確定",
      });
      return;
    }

    await fetchTags();
  };

  return {
    tags,
    teachers,
    loading,
    isEditing,
    currentTag,
    setCurrentTag,
    error,
    openCreateModal,
    openEditModal,
    closeEditModal,
    saveTag,
    deleteTag,
  };
}
