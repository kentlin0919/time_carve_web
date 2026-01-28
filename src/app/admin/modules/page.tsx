"use client";

import { useState } from "react";
import { useSystemModules } from "@/hooks/useSystemModules";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/providers/ModalContext";

export default function AdminModulesPage() {
  const { modules, loading, getModulesByIdentity, updateModule } =
    useSystemModules();
  const { showModal } = useModal();
  const [toggling, setToggling] = useState<string | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ label: "", route: "", icon: "" });

  const handleToggle = async (id: string, currentState: boolean) => {
    setToggling(id);
    const newState = !currentState;

    // 1. Optimistic Update
    updateModule(id, { is_active: newState });

    try {
      const { error } = await supabase
        .from("system_modules")
        .update({ is_active: newState })
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling module:", error);
      showModal({ type: "error", title: "更新失敗", description: "無法更新模組狀態", confirmText: "確定" });
      // 2. Rollback on error
      updateModule(id, { is_active: currentState });
    } finally {
      setToggling(null);
    }
  };

  const startEdit = (module: any) => {
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

      if (error) throw error;
      setEditingId(null);
    } catch (err) {
      console.error("Error updating module:", err);
      showModal({ type: "error", title: "更新失敗", description: "無法更新模組詳情", confirmText: "確定" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  // Map roles to identity IDs
  const sections = [
    { title: "學生功能", identityId: 3, icon: "school" },
    { title: "教師功能", identityId: 2, icon: "co_present" },
    { title: "管理員功能", identityId: 1, icon: "admin_panel_settings" },
  ] as const;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          模組管理
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          管理系統各個角色的功能模組開關與路由設定。關閉的模組將在側邊欄中隱藏。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map(({ title, identityId, icon }) => (
          <div
            key={identityId}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col"
          >
            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500">
                  {icon}
                </span>
                {title}
              </h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700/50 flex-1 overflow-y-auto max-h-[600px]">
              {getModulesByIdentity(identityId).map((module) => (
                <div
                  key={module.id}
                  className="flex items-start justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon Preview */}
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 mt-1 ${module.is_active
                        ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                        }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {editingId === module.id
                          ? editForm.icon || "extension"
                          : module.icon || "extension"}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 min-w-0 mr-4">
                      {editingId === module.id ? (
                        <div className="flex flex-col gap-2 w-full animate-in fade-in duration-200">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-400 font-medium">
                              名稱
                            </label>
                            <input
                              type="text"
                              value={editForm.label}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  label: e.target.value,
                                })
                              }
                              className="text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                              placeholder="Module Name"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-400 font-medium">
                              路由 (Route)
                            </label>
                            <input
                              type="text"
                              value={editForm.route}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  route: e.target.value,
                                })
                              }
                              className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 font-mono dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                              placeholder="/path/to/page"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-gray-400 font-medium">
                              圖示 (Icon)
                            </label>
                            <input
                              type="text"
                              value={editForm.icon}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  icon: e.target.value,
                                })
                              }
                              className="text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1 font-mono dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                              placeholder="material_icon_name"
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => saveEdit(module.id)}
                              className="text-xs bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-md transition-colors"
                            >
                              儲存
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col group/item">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {module.label}
                            </span>
                            <button
                              onClick={() => startEdit(module)}
                              className="text-gray-300 hover:text-sky-500 transition-colors opacity-0 group-hover/item:opacity-100"
                              title="編輯"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                edit
                              </span>
                            </button>
                          </div>

                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-xs text-gray-400 font-mono">
                              Key: {module.key}
                            </span>
                            {module.route ? (
                              <span className="text-[10px] text-gray-500 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded w-fit max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                <span className="material-symbols-outlined text-[10px] flex-shrink-0">
                                  link
                                </span>
                                <span className="truncate">{module.route}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">
                                No route assigned
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingId !== module.id && (
                    <button
                      onClick={() => handleToggle(module.id, module.is_active)}
                      disabled={toggling === module.id}
                      className={`
                        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ml-2 mt-1
                        ${module.is_active
                          ? "bg-sky-500"
                          : "bg-gray-200 dark:bg-gray-700"
                        }
                        ${toggling === module.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                        }
                      `}
                      role="switch"
                      aria-checked={module.is_active}
                    >
                      <span
                        aria-hidden="true"
                        className={`
                          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                          ${module.is_active ? "translate-x-5" : "translate-x-0"
                          }
                        `}
                      />
                    </button>
                  )}
                </div>
              ))}

              {getModulesByIdentity(identityId).length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                  尚無模組
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
