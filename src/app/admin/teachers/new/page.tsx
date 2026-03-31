"use client";

import Link from "next/link";
import { useAddTeacherController } from "./useAddTeacherController";

export default function AddTeacherPage() {
  const {
    loading,
    error,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    toggleShowPassword,
    status,
    setStatus,
    goBack,
    handleRegister,
  } = useAddTeacherController();

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col px-6 py-8 md:px-12 md:py-10">
      <div className="mb-6">
        <Link
          href="/admin/teachers"
          className="group inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-sky-500 dark:text-gray-400"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          <span className="text-sm font-bold">返回教師列表</span>
        </Link>
      </div>

      <header className="mb-10">
        <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">
          新增教師
        </h2>
        <p className="text-base text-gray-500 dark:text-gray-400">
          填寫以下資訊以為牙牙學語系統建立新的教師帳號。
        </p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800 md:p-10">
        <form onSubmit={handleRegister} className="flex flex-col gap-8">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-red-600">
              <span className="material-symbols-outlined">error</span>
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <span className="h-5 w-1 rounded-full bg-sky-500" />
              基本資料
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  教師姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-transparent bg-gray-50 px-4 text-gray-900 outline-none transition-all placeholder:text-gray-400/60 focus:border-sky-500 focus:bg-white focus:ring-0 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-800"
                  placeholder="請輸入真實姓名"
                  required
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  電子郵件 <span className="text-red-500">*</span>
                </label>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-transparent bg-gray-50 px-4 text-gray-900 outline-none transition-all placeholder:text-gray-400/60 focus:border-sky-500 focus:bg-white focus:ring-0 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-800"
                  placeholder="name@example.com"
                  required
                  type="email"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  初始密碼 <span className="text-red-500">*</span>
                </label>
                <div className="group relative">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-xl border-2 border-transparent bg-gray-50 px-4 text-gray-900 outline-none transition-all placeholder:text-gray-400/60 focus:border-sky-500 focus:bg-white focus:ring-0 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-800"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    onClick={toggleShowPassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-sky-500"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                <p className="pl-1 text-xs text-gray-500 dark:text-gray-400">
                  密碼長度須至少 6 碼。
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  確認密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-transparent bg-gray-50 px-4 text-gray-900 outline-none transition-all placeholder:text-gray-400/60 focus:border-sky-500 focus:bg-white focus:ring-0 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-800"
                  placeholder="請再次輸入密碼"
                  required
                  type="password"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="flex flex-col gap-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <span className="h-5 w-1 rounded-full bg-sky-500" />
              權限與方案
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  維護費方案 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="h-12 w-full cursor-pointer appearance-none rounded-xl border-2 border-transparent bg-gray-50 px-4 pr-10 text-gray-900 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-0 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-800"
                    defaultValue="pro"
                  >
                    <option value="basic">基礎版 (Basic)</option>
                    <option value="pro">專業版 (Pro)</option>
                    <option value="enterprise">企業版 (Enterprise)</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    expand_more
                  </span>
                </div>
                <p className="pl-1 text-xs text-gray-500 dark:text-gray-400">
                  不同方案將影響教師可開設的課程數量上限。
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  初始狀態
                </label>
                <div className="flex h-12 items-center gap-4 rounded-xl border-2 border-transparent bg-gray-50 px-4 dark:bg-gray-900">
                  <label className="group flex cursor-pointer items-center gap-2">
                    <input
                      checked={status === "active"}
                      onChange={() => setStatus("active")}
                      className="size-4 border-gray-300 bg-white text-sky-500 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-800"
                      name="status"
                      type="radio"
                      value="active"
                    />
                    <span className="text-sm font-bold text-gray-900 transition-colors group-hover:text-sky-500 dark:text-white">
                      啟用帳號
                    </span>
                  </label>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
                  <label className="group flex cursor-pointer items-center gap-2">
                    <input
                      checked={status === "disabled"}
                      onChange={() => setStatus("disabled")}
                      className="size-4 border-gray-300 bg-white text-gray-400 focus:ring-gray-400 dark:border-gray-600 dark:bg-gray-800"
                      name="status"
                      type="radio"
                      value="disabled"
                    />
                    <span className="text-sm font-medium text-gray-500 transition-colors group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white">
                      暫時禁用
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-4 border-t border-gray-100 pt-6 text-right dark:border-gray-800">
            <button
              onClick={goBack}
              className="h-12 rounded-xl border border-transparent px-6 font-bold text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              type="button"
            >
              取消
            </button>
            <button
              disabled={loading}
              className="flex h-12 items-center gap-2 rounded-xl bg-sky-500 px-8 font-bold text-white shadow-lg shadow-sky-500/20 transition-all active:scale-95 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  sync
                </span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">check</span>
              )}
              <span>{loading ? "處理中..." : "確認新增"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
