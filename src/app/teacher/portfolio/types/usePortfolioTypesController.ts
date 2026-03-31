"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useModal } from "@/components/providers/ModalContext";
import {
  getPortfolioTypes,
  createPortfolioType,
  updatePortfolioType,
  deletePortfolioType,
} from "@/app/actions/portfolio";
import type { PortfolioType } from "@/lib/domain/portfolio/entity";

export function usePortfolioTypesController() {
  const { showModal } = useModal();
  const [types, setTypes] = useState<PortfolioType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentType, setCurrentType] = useState<Partial<PortfolioType>>({});
  const [saving, setSaving] = useState(false);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPortfolioTypes();
      setTypes(data);
    } catch (error) {
      console.error("Error fetching types:", error);
      showModal({
        type: "error",
        title: "讀取失敗",
        description: "無法載入作品集分類，請稍後再試。",
        confirmText: "確定",
      });
    } finally {
      setLoading(false);
    }
  }, [showModal]);

  useEffect(() => {
    void fetchTypes();
  }, [fetchTypes]);

  const openCreateModal = () => {
    setCurrentType({ sort_order: types.length * 10 });
    setIsEditing(true);
  };

  const openEditModal = (type: PortfolioType) => {
    setCurrentType(type);
    setIsEditing(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setCurrentType({});
  };

  const saveType = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentType.name?.trim()) {
      return;
    }

    try {
      setSaving(true);

      if (currentType.id) {
        await updatePortfolioType(currentType.id, {
          name: currentType.name,
          sort_order: currentType.sort_order || 0,
        });
        showModal({
          type: "success",
          title: "更新成功",
          description: "分類已更新。",
          confirmText: "確定",
        });
      } else {
        await createPortfolioType({
          name: currentType.name,
          sort_order: currentType.sort_order || 0,
        });
        showModal({
          type: "success",
          title: "新增成功",
          description: "分類已建立。",
          confirmText: "確定",
        });
      }

      closeEditModal();
      await fetchTypes();
    } catch (error) {
      console.error("Error saving type:", error);
      showModal({
        type: "error",
        title: "儲存失敗",
        description: "操作失敗，請稍後再試。",
        confirmText: "確定",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeType = async (id: string) => {
    if (!window.confirm("確定要刪除此分類嗎？包含此分類的作品集將會變為未分類。")) {
      return;
    }

    try {
      await deletePortfolioType(id);
      showModal({
        type: "success",
        title: "刪除成功",
        description: "分類已刪除。",
        confirmText: "確定",
      });
      await fetchTypes();
    } catch (error) {
      console.error("Error deleting type:", error);
      showModal({
        type: "error",
        title: "刪除失敗",
        description: "刪除失敗，該分類可能正在使用中或發生錯誤。",
        confirmText: "確定",
      });
    }
  };

  return {
    types,
    loading,
    isEditing,
    currentType,
    setCurrentType,
    saving,
    openCreateModal,
    openEditModal,
    closeEditModal,
    saveType,
    removeType,
  };
}
