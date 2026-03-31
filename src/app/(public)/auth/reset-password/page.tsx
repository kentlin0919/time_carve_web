"use client";

import Link from "next/link";
import Image from "next/image";
import { useResetPasswordController } from "./useResetPasswordController";

export default function ResetPasswordPage() {
  const { form, passwordRules, visibility } = useResetPasswordController();

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light text-[#111618] antialiased selection:bg-primary/20 dark:bg-background-dark dark:text-white font-display">
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f3f4] bg-white/80 px-6 py-4 backdrop-blur-md dark:border-b-gray-800 dark:bg-background-dark/80 lg:px-10">
        <div className="flex items-center gap-4 text-[#111618] dark:text-white">
          <Link href="/" className="block size-8 text-primary">
            <svg
              className="h-full w-full"
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z"
                fill="currentColor"
              />
              <path
                clipRule="evenodd"
                d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </Link>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-[#111618] dark:text-white">
            家教預約平台
          </h2>
        </div>
      </header>

      <div className="layout-container relative z-0 flex h-full grow flex-col">
        <div className="pointer-events-none absolute left-0 top-0 -z-10 h-full w-full overflow-hidden">
          <div className="absolute left-[20%] top-[10%] h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-[10%] right-[20%] h-80 w-80 rounded-full bg-purple-500/5 blur-3xl" />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-12 md:py-20">
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-none md:p-12">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary to-purple-300" />
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                <span className="material-symbols-outlined text-[32px]">
                  lock_reset
                </span>
              </div>
              <h2 className="mb-3 text-2xl font-black tracking-tight text-[#111618] dark:text-white md:text-3xl">
                重設密碼
              </h2>
              <p className="max-w-xs text-sm leading-relaxed text-[#617f89] dark:text-gray-400">
                請輸入您的新密碼並確認。為了您的帳號安全，建議使用包含字母、數字和符號的強密碼組合。
              </p>
            </div>

            <form onSubmit={form.onSubmit} className="space-y-6">
              {form.message && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  {form.message}
                </div>
              )}
              {form.error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {form.error}
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-2 text-left">
                  <label
                    className="ml-1 text-sm font-bold text-[#111618] dark:text-gray-200"
                    htmlFor="new_password"
                  >
                    新密碼
                  </label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        lock
                      </span>
                    </div>
                    <input
                      className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:text-sm"
                      id="new_password"
                      name="new_password"
                      placeholder="••••••••"
                      required
                      type={visibility.showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => form.setPassword(event.target.value)}
                    />
                    <button
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-4 text-slate-400 transition-colors hover:text-primary"
                      type="button"
                      onClick={() =>
                        visibility.setShowPassword((previous) => !previous)
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {visibility.showPassword ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                  <div className="px-1 pt-1">
                    <div className="mb-2 flex h-1.5 gap-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className={`h-full ${
                            index < passwordRules.strengthScore
                              ? "bg-primary/60"
                              : "bg-slate-200 dark:bg-gray-700"
                          }`}
                          style={{ width: "25%" }}
                        />
                      ))}
                    </div>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-500 dark:text-gray-400">
                      <li
                        className={`flex items-center gap-2 ${
                          passwordRules.hasMinLength
                            ? "font-medium text-emerald-500"
                            : "text-slate-500 dark:text-gray-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {passwordRules.hasMinLength
                            ? "check_circle"
                            : "radio_button_unchecked"}
                        </span>
                        <span className="text-slate-700 dark:text-gray-300">
                          至少 8 個字元
                        </span>
                      </li>
                      <li
                        className={`flex items-center gap-2 ${
                          passwordRules.hasUppercase
                            ? "font-medium text-emerald-500"
                            : "text-slate-500 dark:text-gray-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {passwordRules.hasUppercase
                            ? "check_circle"
                            : "radio_button_unchecked"}
                        </span>
                        <span className="text-slate-700 dark:text-gray-300">
                          包含大寫字母
                        </span>
                      </li>
                      <li
                        className={`flex items-center gap-2 ${
                          passwordRules.hasNumberOrSymbol
                            ? "font-medium text-emerald-500"
                            : "text-slate-500 dark:text-gray-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {passwordRules.hasNumberOrSymbol
                            ? "check_circle"
                            : "radio_button_unchecked"}
                        </span>
                        <span className="text-slate-700 dark:text-gray-300">
                          包含數字或特殊符號
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label
                    className="ml-1 text-sm font-bold text-[#111618] dark:text-gray-200"
                    htmlFor="confirm_password"
                  >
                    確認新密碼
                  </label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        verified_user
                      </span>
                    </div>
                    <input
                      className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-primary focus:ring-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:text-sm"
                      id="confirm_password"
                      name="confirm_password"
                      placeholder="••••••••"
                      required
                      type={visibility.showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(event) =>
                        form.setConfirmPassword(event.target.value)
                      }
                    />
                    <button
                      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-4 text-slate-400 transition-colors hover:text-primary"
                      type="button"
                      onClick={() =>
                        visibility.setShowConfirmPassword((previous) => !previous)
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {visibility.showConfirmPassword
                          ? "visibility"
                          : "visibility_off"}
                      </span>
                    </button>
                  </div>
                  {form.confirmPassword.length > 0 && (
                    <p
                      className={`text-xs ${
                        passwordRules.passwordsMatch
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {passwordRules.passwordsMatch ? "密碼一致" : "密碼不一致"}
                    </p>
                  )}
                </div>
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-[#0fa0d1] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={!form.canSubmit}
              >
                {form.loading ? "更新中..." : "完成設定"}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-6 text-center dark:border-gray-700/50">
              <Link
                href="/auth/login"
                className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-primary dark:text-gray-400"
              >
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">
                  arrow_back
                </span>
                返回登入
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#f0f3f4] bg-white px-6 py-10 dark:border-gray-800 dark:bg-gray-900 lg:px-40">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="relative size-6">
              <Image
                src="/logo.svg"
                alt="TimeCarve Logo"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-[#617f89] dark:text-gray-500">
              © 2025 TimeCarve 刻時. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            <Link
              href="/legal/privacy"
              className="text-sm font-medium text-[#617f89] transition-colors hover:text-primary dark:text-gray-500"
            >
              隱私權政策
            </Link>
            <Link
              href="/legal/terms"
              className="text-sm font-medium text-[#617f89] transition-colors hover:text-primary dark:text-gray-500"
            >
              服務條款
            </Link>
            <Link
              href="/faq"
              className="text-sm font-medium text-[#617f89] transition-colors hover:text-primary dark:text-gray-500"
            >
              常見問題
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
