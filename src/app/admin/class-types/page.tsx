"use client";

import { useAdminClassTypesController } from "./useAdminClassTypesController";

export default function CourseTypesPage() {
  const {
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
  } = useAdminClassTypesController();

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            課程類型管理
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            共 {types.length} 筆 • 啟用 {activeCount} 筆
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜尋代碼或名稱"
              className="rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | "active" | "inactive"
              )
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="all">全部狀態</option>
            <option value="active">啟用中</option>
            <option value="inactive">已停用</option>
          </select>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-white transition-colors hover:bg-sky-600"
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm font-medium text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
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
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {type.label_zh}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        type.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {type.is_active ? "啟用" : "停用"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {type.created_at
                      ? new Date(type.created_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(type)}
                      className="mr-3 text-sky-500 hover:text-sky-600"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleToggleActive(type)}
                      className="mr-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
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

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentType.class_type_id ? "編輯類型" : "新增類型"}
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
                  代碼 (Key) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentType.name || ""}
                  onChange={(event) =>
                    setCurrentType({ ...currentType, name: event.target.value })
                  }
                  placeholder="例如：online"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  用於系統識別，建議使用英文 (例如: 1-on-1, group)
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  顯示名稱 (中文) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentType.label_zh || ""}
                  onChange={(event) =>
                    setCurrentType({
                      ...currentType,
                      label_zh: event.target.value,
                    })
                  }
                  placeholder="例如：線上課程"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <label className="flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={currentType.is_active ?? true}
                    onChange={(event) =>
                      setCurrentType({
                        ...currentType,
                        is_active: event.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    啟用此類型
                  </span>
                </label>
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
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-sky-500 px-4 py-2 text-white shadow-sm shadow-sky-500/30 transition-colors disabled:opacity-60 hover:bg-sky-600"
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
