"use client";

import { useState } from "react";
import { useSystemModules } from "@/hooks/useSystemModules";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/providers/ModalContext";
import type { Database } from "@/types/database.types";

type SystemModule = Database["public"]["Tables"]["system_modules"]["Row"];

const sections = [
  { title: "學生功能", identityId: 3, icon: "school" },
  { title: "教師功能", identityId: 2, icon: "co_present" },
  { title: "管理員功能", identityId: 1, icon: "admin_panel_settings" },
] as const;

export function useAdminModulesController() {
  const { modules, loading, getModulesByIdentity, updateModule } =
    useSystemModules();
  const { showModal } = useModal();
  const [toggling, setToggling] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: "", route: "", icon: "" });

  const handleToggle = async (id: string, currentState: boolean) => {
    setToggling(id);
    const nextState = !currentState;

    updateModule(id, { is_active: nextState });

    try {
      const { error } = await supabase
        .from("system_modules")
        .update({ is_active: nextState })
        .eq("id", id);

      if (error) {
        throw error;
      }
    } catch (toggleError) {
      console.error("Error toggling module:", toggleError);
      showModal({
        type: "error",
        title: "更新失敗",
        description: "無法更新模組狀態",
        confirmText: "確定",
      });
      updateModule(id, { is_active: currentState });
    } finally {
      setToggling(null);
    }
  };

  const startEdit = (module: SystemModule) => {
    setEditingId(module.id);
    setEditForm({
      label: module.label,
      route: module.route || "",
      icon: module.icon || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ label: "", route: "", icon: "" });
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from("system_modules")
        .update({
          label: editForm.label,
          route: editForm.route || null,
          icon: editForm.icon || null,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      updateModule(id, {
        label: editForm.label,
        route: editForm.route || null,
        icon: editForm.icon || null,
      });
      setEditingId(null);
    } catch (saveError) {
      console.error("Error updating module:", saveError);
      showModal({
        type: "error",
        title: "更新失敗",
        description: "無法更新模組詳情",
        confirmText: "確定",
      });
    }
  };

  return {
    modules,
    loading,
    toggling,
    editingId,
    editForm,
    setEditForm,
    sections,
    getModulesByIdentity,
    handleToggle,
    startEdit,
    cancelEdit,
    saveEdit,
  };
}
