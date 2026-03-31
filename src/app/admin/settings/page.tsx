"use client";

import { useAdminSettingsController } from "./useAdminSettingsController";

export default function AdminSettingsPage() {
  const {
    loading,
    saving,
    message,
    settings,
    updateSettingValue,
    saveSettings,
  } = useAdminSettingsController();

  if (loading) {
    return <div className="p-8">載入中...</div>;
  }

  return (
    <div className="max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        系統設定
      </h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 border-b pb-2 text-lg font-bold text-slate-800 dark:border-gray-700 dark:text-white">
          平台聯絡資訊
        </h2>

        {message && (
          <div
            className={`mb-4 rounded-lg p-3 text-sm ${
              message.includes("失敗")
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-5">
          {settings.map((setting) => (
            <div key={setting.key}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-gray-300">
                {setting.label || setting.key}
              </label>
              <input
                type="text"
                value={setting.value || ""}
                onChange={(event) =>
                  updateSettingValue(setting.key, event.target.value)
                }
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-900 transition-all outline-none focus:ring-2 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="rounded-lg bg-sky-500 px-6 py-2.5 font-bold text-white shadow-md shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-50 hover:bg-sky-600"
          >
            {saving ? "儲存中..." : "儲存設定"}
          </button>
        </div>
      </div>
    </div>
  );
}
