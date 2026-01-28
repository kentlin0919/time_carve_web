"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/providers/ModalContext";

interface CourseType {
  class_type_id: number;
  name: string;
  label_zh: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export default function CourseTypesPage() {
  const [types, setTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentType, setCurrentType] = useState<Partial<CourseType>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { showModal } = useModal();

  useEffect(() => {
    fetchTypes();
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
      setTypes(data || []);
    }
    setLoading(false);
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
        // Update
        const { error } = await supabase
          .from("class_type")
          .update({
            name: trimmedName,
            label_zh: trimmedLabel,
            is_active: currentType.is_active,
          })
          .eq("class_type_id", currentType.class_type_id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from("class_type").insert({
          name: trimmedName,
          label_zh: trimmedLabel,
          is_active: currentType.is_active ?? true,
        });
        if (error) throw error;
      }

      setIsEditing(false);
      setCurrentType({});
      fetchTypes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (type: CourseType) => {
    setUpdatingId(type.class_type_id);
    setError(null);
    const nextValue = !type.is_active;
    setTypes((prev) =>
      prev.map((item) =>
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
      setTypes((prev) =>
        prev.map((item) =>
          item.class_type_id === type.class_type_id
            ? { ...item, is_active: type.is_active }
            : item
        )
      );
    }
    setUpdatingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除此類型嗎？")) return;

    const { error } = await supabase
      .from("class_type")
      .delete()
      .eq("class_type_id", id);
    if (error) {
      showModal({ type: "error", title: "刪除失敗", description: error.message, confirmText: "確定" });
    } else {
      fetchTypes();
    }
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

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            課程類型管理
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            共 {types.length} 筆 • 啟用 {activeCount} 筆
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋代碼或名稱"
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
          >
            <option value="all">全部狀態</option>
            <option value="active">啟用中</option>
            <option value="inactive">已停用</option>
          </select>
          <button
            onClick={() => {
              setCurrentType({ is_active: true });
              setIsEditing(true);
              setError(null);
            }}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            新增類型
          </button>
        </div>
      </div>

      {error && !isEditing && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-sm font-medium">
            <tr>
              <th className="px-6 py-4">代碼 (Key)</th>
              <th className="px-6 py-4">顯示名稱 (中文)</th>
              <th className="px-6 py-4">狀態</th>
              <th className="px-6 py-4">建立時間</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  載入中...
                </td>
              </tr>
            ) : filteredTypes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  找不到符合條件的類型
                </td>
              </tr>
            ) : (
              filteredTypes.map((type) => (
                <tr
                  key={type.class_type_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                    {type.name}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                    {type.label_zh}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                    >
                      {type.is_active ? "啟用" : "停用"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {type.created_at ? new Date(type.created_at).toLocaleString() : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setCurrentType(type);
                        setIsEditing(true);
                        setError(null);
                      }}
                      className="text-sky-500 hover:text-sky-600 mr-3"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleToggleActive(type)}
                      className="text-gray-500 hover:text-gray-700 mr-3 disabled:opacity-50"
                      disabled={updatingId === type.class_type_id}
                    >
                      {type.is_active ? "停用" : "啟用"}
                    </button>
                    <button
                      onClick={() => handleDelete(type.class_type_id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentType.class_type_id ? "編輯類型" : "新增類型"}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  代碼 (Key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentType.name || ""}
                  onChange={(e) =>
                    setCurrentType({ ...currentType, name: e.target.value })
                  }
                  placeholder="例如：online"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用於系統識別，建議使用英文 (例如: 1-on-1, group)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  顯示名稱 (中文) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentType.label_zh || ""}
                  onChange={(e) =>
                    setCurrentType({ ...currentType, label_zh: e.target.value })
                  }
                  placeholder="例如：線上課程"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentType.is_active ?? true}
                    onChange={(e) =>
                      setCurrentType({
                        ...currentType,
                        is_active: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-sky-500 border-gray-300 rounded focus:ring-sky-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    啟用此類型
                  </span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm shadow-sky-500/30 disabled:opacity-60"
              >
                {saving ? "儲存中..." : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
