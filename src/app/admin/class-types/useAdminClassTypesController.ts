"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/providers/ModalContext";
import type { Database } from "@/types/database.types";

type ClassType = Database["public"]["Tables"]["class_type"]["Row"];
type StatusFilter = "all" | "active" | "inactive";

export function useAdminClassTypesController() {
  const { showModal } = useModal();
  const [types, setTypes] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentType, setCurrentType] = useState<Partial<ClassType>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    void fetchTypes();
  }, []);

  const fetchTypes = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("class_type")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching types:", error);
      setError("讀取課程類型失敗，請稍後再試。");
    } else {
      setTypes(data ?? []);
    }

    setLoading(false);
  };

  const openCreateModal = () => {
    setCurrentType({ is_active: true });
    setIsEditing(true);
    setError(null);
  };

  const openEditModal = (type: ClassType) => {
    setCurrentType(type);
    setIsEditing(true);
    setError(null);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setCurrentType({});
  };

  const handleSave = async () => {
    setError(null);
    const trimmedName = currentType.name?.trim();
    const trimmedLabel = currentType.label_zh?.trim();

    if (!trimmedName || !trimmedLabel) {
      setError("請填寫所有必填欄位");
      return;
    }

    try {
      setSaving(true);

      if (currentType.class_type_id) {
        const { error } = await supabase
          .from("class_type")
          .update({
            name: trimmedName,
            label_zh: trimmedLabel,
            is_active: currentType.is_active,
          })
          .eq("class_type_id", currentType.class_type_id);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("class_type").insert({
          name: trimmedName,
          label_zh: trimmedLabel,
          is_active: currentType.is_active ?? true,
        });

        if (error) {
          throw error;
        }
      }

      closeEditModal();
      await fetchTypes();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (type: ClassType) => {
    setUpdatingId(type.class_type_id);
    setError(null);
    const nextValue = !type.is_active;

    setTypes((previous) =>
      previous.map((item) =>
        item.class_type_id === type.class_type_id
          ? { ...item, is_active: nextValue }
          : item
      )
    );

    const { error } = await supabase
      .from("class_type")
      .update({ is_active: nextValue })
      .eq("class_type_id", type.class_type_id);

    if (error) {
      console.error("Error updating type:", error);
      setError("更新狀態失敗，請稍後再試。");
      setTypes((previous) =>
        previous.map((item) =>
          item.class_type_id === type.class_type_id
            ? { ...item, is_active: type.is_active }
            : item
        )
      );
    }

    setUpdatingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("確定要刪除此類型嗎？")) {
      return;
    }

    const { error } = await supabase
      .from("class_type")
      .delete()
      .eq("class_type_id", id);

    if (error) {
      showModal({
        type: "error",
        title: "刪除失敗",
        description: error.message,
        confirmText: "確定",
      });
      return;
    }

    await fetchTypes();
  };

  const filteredTypes = useMemo(() => {
    return types.filter((type) => {
      const matchesQuery =
        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (type.label_zh?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? type.is_active
            : !type.is_active;

      return matchesQuery && matchesStatus;
    });
  }, [types, searchQuery, statusFilter]);

  const activeCount = useMemo(
    () => types.filter((type) => type.is_active).length,
    [types]
  );

  return {
    types,
    loading,
    isEditing,
    currentType,
    setCurrentType,
    error,
    saving,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    updatingId,
    filteredTypes,
    activeCount,
    openCreateModal,
    openEditModal,
    closeEditModal,
    handleSave,
    handleToggleActive,
    handleDelete,
  };
}
