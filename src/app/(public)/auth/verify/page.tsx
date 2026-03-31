"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useVerifyController } from "./useVerifyController";

function VerifyContent() {
  const {
    email,
    otp,
    loading,
    error,
    formattedTime,
    canResend,
    inputRefs,
    onChangeOtp,
    onOtpKeyDown,
    onOtpPaste,
    onSubmit,
    onResend,
  } = useVerifyController();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light text-[#111618] transition-colors duration-200 dark:bg-background-dark dark:text-gray-100 font-display">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 bg-surface-light px-6 py-4 dark:border-gray-800 dark:bg-surface-dark lg:px-10">
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="flex size-10 items-center justify-center rounded-full text-[#111618] transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold leading-tight tracking-tight text-[#111618] dark:text-white">
              TimeCarve 刻時
            </h2>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              專業家教預約系統
            </span>
          </div>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            訪客
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-100 bg-surface-light p-8 shadow-xl dark:border-gray-800 dark:bg-surface-dark dark:shadow-none">
          <div className="flex justify-center">
            <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <span className="material-symbols-outlined text-4xl text-primary">
                mark_email_read
              </span>
              <div className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-white bg-surface-light dark:border-[#18282e] dark:bg-surface-dark">
                <span className="material-symbols-outlined text-sm text-green-500">
                  check_circle
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#111618] dark:text-white">
              輸入驗證碼
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              我們已發送 6 位數驗證碼至{" "}
              <span className="font-semibold text-[#111618] dark:text-gray-200">
                {email}
              </span>
              。<br />
              請查收信件並在下方輸入。
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={onOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    pattern="\d*"
                    value={digit}
                    onChange={(event) => onChangeOtp(index, event.target.value)}
                    onKeyDown={(event) => onOtpKeyDown(index, event)}
                    className={`flex h-12 w-10 rounded-lg border text-center text-xl font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 sm:h-14 sm:w-12 sm:text-2xl ${
                      digit
                        ? "border-primary bg-white text-[#111618] ring-2 ring-primary/20 dark:bg-gray-800 dark:text-white"
                        : "border-gray-300 bg-gray-50 text-[#111618] focus:border-primary dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="animate-pulse text-red-500 flex items-center justify-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-2 pt-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-lg">timer</span>
                  <span>
                    驗證碼有效期剩餘{" "}
                    <span className="font-mono font-medium text-[#111618] dark:text-gray-200">
                      {formattedTime}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    沒收到驗證碼？
                  </span>
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={!canResend || loading}
                    className={`font-semibold transition-colors ${
                      canResend
                        ? "text-primary hover:text-primary/80"
                        : "cursor-not-allowed text-gray-400"
                    }`}
                  >
                    重新發送
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary px-5 text-base font-bold leading-normal tracking-[0.015em] text-white shadow-lg shadow-primary/30 transition-all hover:bg-[#0fa4d6] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-xl">
                        progress_activity
                      </span>
                      驗證中...
                    </span>
                  ) : (
                    <span className="truncate">驗證</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/contact"
            className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">help</span>
            遇到問題？聯繫客服
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
