"use client";

import { usePortfolioTypesController } from "./usePortfolioTypesController";

export default function PortfolioTypesPage() {
  const {
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
  } = usePortfolioTypesController();

  return (
    <div className="mx-auto max-w-5xl p-6 pb-20 md:p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            作品集分類管理
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            建立與管理您的自訂作品分類，讓作品集更有組織。
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          <span className="material-symbols-outlined">add</span>
          新增分類
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-light bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <table className="w-full text-left">
          <thead className="border-b border-border-light bg-gray-50 text-sm font-medium text-gray-500 dark:border-border-dark dark:bg-gray-700/50 dark:text-gray-400">
            <tr>
              <th className="w-20 px-6 py-4 text-center">排序</th>
              <th className="px-6 py-4">分類名稱</th>
              <th className="px-6 py-4 text-right">建立時間</th>
              <th className="w-32 px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <span className="material-symbols-outlined mb-2 animate-spin text-3xl">
                    progress_activity
                  </span>
                  <p>載入中...</p>
                </td>
              </tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-gray-300">
                      category
                    </span>
                    <p>尚無自訂分類</p>
                    <button
                      onClick={openCreateModal}
                      className="text-sm text-primary hover:underline"
                    >
                      立即建立第一個分類
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              types.map((type) => (
                <tr
                  key={type.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 text-center font-mono text-sm text-gray-500">
                    {type.sort_order}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {type.name}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                    {new Date(type.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(type)}
                        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-primary/10 hover:text-primary"
                        title="編輯"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => removeType(type.id)}
                        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        title="刪除"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md transform rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all scale-100 opacity-100 dark:border-gray-700 dark:bg-surface-dark">
            <form onSubmit={saveType}>
              <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentType.id ? "編輯分類" : "新增分類"}
                </h3>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
                    分類名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentType.name || ""}
                    onChange={(event) =>
                      setCurrentType({ ...currentType, name: event.target.value })
                    }
                    placeholder="例如：假牙案例"
                    className="w-full rounded-xl border border-border-light bg-slate-50 px-4 py-2 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-primary/50 dark:border-border-dark dark:bg-slate-800/50 dark:text-white"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">
                    排序權重
                  </label>
                  <input
                    type="number"
                    value={currentType.sort_order || 0}
                    onChange={(event) =>
                      setCurrentType({
                        ...currentType,
                        sort_order: parseInt(event.target.value, 10) || 0,
                      })
                    }
                    className="w-full rounded-xl border border-border-light bg-slate-50 px-4 py-2 text-gray-900 outline-none transition-all focus:ring-2 focus:ring-primary/50 dark:border-border-dark dark:bg-slate-800/50 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    數字越小越靠前 (支援負數)
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50/50 p-6 dark:border-gray-700 dark:bg-gray-800/30">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg px-4 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-bold text-white shadow-lg shadow-primary/30 transition-colors disabled:opacity-60 hover:bg-primary-dark"
                >
                  {saving && (
                    <span className="material-symbols-outlined animate-spin text-sm">
                      progress_activity
                    </span>
                  )}
                  {saving ? "儲存中..." : "儲存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
