"use client";

import Select from "@/components/ui/Select";
import { useAdminTagsController } from "./useAdminTagsController";

export default function TagsPage() {
  const {
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
  } = useAdminTagsController();

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          標籤管理
        </h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-white transition-colors hover:bg-sky-600"
        >
          <span className="material-symbols-outlined">add</span>
          新增標籤
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm font-medium text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4">標籤名稱</th>
              <th className="px-6 py-4">所屬教師</th>
              <th className="px-6 py-4">建立時間</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  載入中...
                </td>
              </tr>
            ) : tags.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  尚無資料
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr
                  key={tag.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {tag.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {tag.teacher_id ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                        <span className="material-symbols-outlined text-[14px]">
                          person
                        </span>
                        {tag.teacher_info?.user_info?.name || "未知教師"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                        <span className="material-symbols-outlined text-[14px]">
                          public
                        </span>
                        全域標籤
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(tag.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(tag)}
                      className="mr-3 text-sky-500 hover:text-sky-600"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => deleteTag(tag.id)}
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

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentTag.id ? "編輯標籤" : "新增標籤"}
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 p-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  標籤名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentTag.name || ""}
                  onChange={(event) =>
                    setCurrentTag({ ...currentTag, name: event.target.value })
                  }
                  placeholder="例如：熱門, 考試必備"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <Select
                  label="標籤類型 / 所屬教師"
                  value={currentTag.teacher_id || ""}
                  onChange={(event) =>
                    setCurrentTag({
                      ...currentTag,
                      teacher_id: event.target.value || null,
                    })
                  }
                  options={[
                    { value: "", label: "🌐 全域標籤 (所有教師可見)" },
                    {
                      label: "指定給特定教師",
                      options: teachers.map((teacher) => ({
                        value: teacher.id,
                        label: `👤 ${teacher.name}`,
                      })),
                    },
                  ]}
                />
                <p className="mt-1 text-xs text-gray-500">
                  選擇「全域標籤」將讓所有教師都能在建立課程時看到此選項。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 p-6 dark:border-gray-700">
              <button
                onClick={closeEditModal}
                className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={saveTag}
                className="rounded-lg bg-sky-500 px-4 py-2 text-white shadow-sm shadow-sky-500/30 transition-colors hover:bg-sky-600"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
