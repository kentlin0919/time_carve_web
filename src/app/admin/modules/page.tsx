"use client";

import { useAdminModulesController } from "./useAdminModulesController";

export default function AdminModulesPage() {
  const {
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
  } = useAdminModulesController();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          模組管理
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          管理系統各個角色的功能模組開關與路由設定。關閉的模組將在側邊欄中隱藏。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ title, identityId, icon }) => (
          <div
            key={identityId}
            className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700/50">
              <h2 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <span className="material-symbols-outlined text-gray-500">
                  {icon}
                </span>
                {title}
              </h2>
            </div>

            <div className="max-h-[600px] flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700/50">
              {getModulesByIdentity(identityId).map((module) => (
                <div
                  key={module.id}
                  className="flex items-start justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <div className="flex flex-1 items-start gap-4">
                    <div
                      className={`mt-1 flex-shrink-0 rounded-lg p-2 ${
                        module.is_active
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

                    <div className="mr-4 flex min-w-0 flex-1 flex-col">
                      {editingId === module.id ? (
                        <div className="animate-in flex w-full flex-col gap-2 fade-in duration-200">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-gray-400">
                              名稱
                            </label>
                            <input
                              type="text"
                              value={editForm.label}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  label: event.target.value,
                                })
                              }
                              className="rounded border border-gray-200 px-2 py-1 text-sm focus:ring-2 focus:ring-sky-500 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              placeholder="Module Name"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-gray-400">
                              路由 (Route)
                            </label>
                            <input
                              type="text"
                              value={editForm.route}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  route: event.target.value,
                                })
                              }
                              className="rounded border border-gray-200 px-2 py-1 font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              placeholder="/path/to/page"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-medium text-gray-400">
                              圖示 (Icon)
                            </label>
                            <input
                              type="text"
                              value={editForm.icon}
                              onChange={(event) =>
                                setEditForm({
                                  ...editForm,
                                  icon: event.target.value,
                                })
                              }
                              className="rounded border border-gray-200 px-2 py-1 font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              placeholder="material_icon_name"
                            />
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => saveEdit(module.id)}
                              className="rounded-md bg-sky-500 px-3 py-1.5 text-xs text-white transition-colors hover:bg-sky-600"
                            >
                              儲存
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group/item flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {module.label}
                            </span>
                            <button
                              onClick={() => startEdit(module)}
                              className="text-gray-300 opacity-0 transition-colors hover:text-sky-500 group-hover/item:opacity-100"
                              title="編輯"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                edit
                              </span>
                            </button>
                          </div>

                          <div className="mt-1 flex flex-col gap-1">
                            <span className="font-mono text-xs text-gray-400">
                              Key: {module.key}
                            </span>
                            {module.route ? (
                              <span className="flex max-w-full w-fit items-center gap-1 overflow-hidden rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 whitespace-nowrap text-ellipsis dark:bg-gray-800">
                                <span className="material-symbols-outlined flex-shrink-0 text-[10px]">
                                  link
                                </span>
                                <span className="truncate">{module.route}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] italic text-gray-400">
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
                      className={`relative ml-2 mt-1 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                        module.is_active ? "bg-sky-500" : "bg-gray-200 dark:bg-gray-700"
                      } ${toggling === module.id ? "cursor-not-allowed opacity-50" : ""}`}
                      role="switch"
                      aria-checked={module.is_active}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          module.is_active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  )}
                </div>
              ))}

              {getModulesByIdentity(identityId).length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-gray-500">
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
