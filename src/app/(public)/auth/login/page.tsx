"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLoginPageController } from "./useLoginPageController";

function FullPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="flex flex-col items-center gap-4 text-slate-600 dark:text-slate-300">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium">載入中...</p>
      </div>
    </div>
  );
}

function LoginContent() {
  const {
    pageReady,
    activeTab,
    setActiveTab,
    heroContent,
    loginForm,
    registerForm,
  } = useLoginPageController();

  if (!pageReady) {
    return <FullPageLoading />;
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light text-[#111618] antialiased selection:bg-primary/20 dark:bg-background-dark dark:text-white font-display">
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f3f4] bg-white/80 px-6 py-4 backdrop-blur-md dark:border-b-gray-800 dark:bg-background-dark/80 lg:px-10">
        <div className="flex items-center gap-4 text-[#111618] dark:text-white">
          <div className="relative size-8">
            <Image
              src="/logo.svg"
              alt="TimeCarve Logo"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-[#111618] dark:text-white">
            TimeCarve 刻時
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <div className="flex items-center gap-4">
            <button className="text-[#111618] dark:text-white lg:hidden">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background-light to-blue-50/50 p-4 dark:from-background-dark dark:to-gray-900 lg:p-8">
        <div className="flex min-h-[640px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] dark:border-gray-700/50 dark:bg-gray-800 md:flex-row">
          {heroContent.imageUrl && (
            <div
              className="relative hidden w-1/2 flex-col justify-between bg-cover bg-center p-12 text-white md:flex"
              style={{
                backgroundImage: `url("${heroContent.imageUrl}")`,
              }}
            >
              <div className="absolute inset-0 bg-primary/80 mix-blend-multiply opacity-90 dark:opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-12">
                  <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/20 shadow-lg backdrop-blur-md">
                    <span className="material-symbols-outlined text-3xl">
                      school
                    </span>
                  </div>
                  <h2 className="mb-4 text-4xl font-bold leading-tight tracking-tight">
                    {heroContent.titleLine1}
                    <br />
                    {heroContent.titleLine2}
                  </h2>
                  <p className="text-lg leading-relaxed text-white/90">
                    {heroContent.subtitle}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div
            className={`relative flex w-full flex-col justify-center bg-white p-8 dark:bg-gray-800 lg:p-12 ${
              heroContent.imageUrl ? "md:w-1/2" : ""
            }`}
          >
            <div className="relative mx-auto w-full max-w-sm">
              <input
                className="peer/login hidden"
                id="tab-login"
                name="auth-tabs"
                type="radio"
                checked={activeTab === "login"}
                onChange={() => setActiveTab("login")}
              />
              <input
                className="peer/register hidden"
                id="tab-register"
                name="auth-tabs"
                type="radio"
                checked={activeTab === "register"}
                onChange={() => setActiveTab("register")}
              />

              <div className="relative mb-8 flex justify-center gap-6 border-b border-slate-100 dark:border-gray-700">
                <label
                  className="cursor-pointer pb-3 text-lg font-bold text-slate-400 transition-all hover:text-slate-600 peer-checked/login:-mb-[2px] peer-checked/login:border-b-2 peer-checked/login:border-primary peer-checked/login:text-primary dark:text-gray-500 dark:hover:text-gray-300 dark:peer-checked/login:text-primary"
                  htmlFor="tab-login"
                >
                  登入
                </label>
                <label
                  className="cursor-pointer pb-3 text-lg font-bold text-slate-400 transition-all hover:text-slate-600 peer-checked/register:-mb-[2px] peer-checked/register:border-b-2 peer-checked/register:border-primary peer-checked/register:text-primary dark:text-gray-500 dark:hover:text-gray-300 dark:peer-checked/register:text-primary"
                  htmlFor="tab-register"
                >
                  學員註冊
                </label>
              </div>

              <div
                className={`hidden ${
                  activeTab === "login"
                    ? "!block animate-[fadeIn_0.3s_ease-out]"
                    : ""
                }`}
              >
                <form className="space-y-5" onSubmit={loginForm.onSubmit}>
                  {loginForm.error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/10">
                      {loginForm.error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-bold text-slate-700 dark:text-gray-300"
                      htmlFor="login-email"
                    >
                      電子郵件
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                        mail
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-primary dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700"
                        id="login-email"
                        placeholder="name@example.com"
                        type="email"
                        value={loginForm.email}
                        onChange={(event) => loginForm.setEmail(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        className="text-sm font-bold text-slate-700 dark:text-gray-300"
                        htmlFor="login-password"
                      >
                        密碼
                      </label>
                      <Link
                        className="text-xs font-medium text-primary transition-colors hover:text-primary-dark"
                        href="/auth/forgot-password"
                      >
                        忘記密碼？
                      </Link>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                        lock
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-primary dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700"
                        id="login-password"
                        placeholder="••••••••"
                        type="password"
                        value={loginForm.password}
                        onChange={(event) =>
                          loginForm.setPassword(event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      className="rounded border-slate-300 text-primary focus:ring-primary dark:border-gray-600"
                      id="remember"
                      type="checkbox"
                    />
                    <label
                      className="text-sm text-slate-600 dark:text-gray-400"
                      htmlFor="remember"
                    >
                      記住我的登入資訊
                    </label>
                  </div>

                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loginForm.loading}
                  >
                    <span>{loginForm.loading ? "登入中..." : "立即登入"}</span>
                    {!loginForm.loading && (
                      <span className="material-symbols-outlined text-[20px]">
                        arrow_forward
                      </span>
                    )}
                  </button>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400 dark:bg-gray-800">
                        或使用以下方式登入
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 48 48"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                        <path fill="none" d="M0 0h48v48H0z" />
                      </svg>
                      <span>使用 Google 登入</span>
                    </button>
                  </div>
                </form>
              </div>

              <div
                className={`hidden ${
                  activeTab === "register"
                    ? "!block animate-[fadeIn_0.3s_ease-out]"
                    : ""
                }`}
              >
                <div className="mb-4 flex gap-2 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                  <span className="material-symbols-outlined shrink-0 text-[18px]">
                    info
                  </span>
                  <p>
                    此註冊通道僅供<strong>課程學員</strong>
                    使用。教師帳號請聯繫管理員建立。
                  </p>
                </div>

                <form className="space-y-4" onSubmit={registerForm.onSubmit}>
                  {registerForm.error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/10">
                      {registerForm.error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-bold text-slate-700 dark:text-gray-300"
                      htmlFor="reg-name"
                    >
                      姓名
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                        person
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-primary dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700"
                        id="reg-name"
                        placeholder="您的真實姓名"
                        type="text"
                        value={registerForm.name}
                        onChange={(event) => registerForm.setName(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-bold text-slate-700 dark:text-gray-300"
                      htmlFor="reg-email"
                    >
                      電子郵件
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                        mail
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-primary dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700"
                        id="reg-email"
                        placeholder="name@example.com"
                        type="email"
                        value={registerForm.email}
                        onChange={(event) =>
                          registerForm.setEmail(event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        className="text-sm font-bold text-slate-700 dark:text-gray-300"
                        htmlFor="reg-password"
                      >
                        設定密碼
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                          lock
                        </span>
                        <input
                          className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-primary dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700"
                          id="reg-password"
                          placeholder="••••••"
                          type="password"
                          value={registerForm.password}
                          onChange={(event) =>
                            registerForm.setPassword(event.target.value)
                          }
                          required
                          minLength={8}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        className="text-sm font-bold text-slate-700 dark:text-gray-300"
                        htmlFor="reg-confirm"
                      >
                        確認密碼
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                          lock_reset
                        </span>
                        <input
                          className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-primary dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700"
                          id="reg-confirm"
                          placeholder="••••••"
                          type="password"
                          value={registerForm.confirmPassword}
                          onChange={(event) =>
                            registerForm.setConfirmPassword(event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="text-sm font-bold text-slate-700 dark:text-gray-300"
                      htmlFor="reg-teacher-code"
                    >
                      教師代碼
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                        key
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-primary dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700"
                        id="reg-teacher-code"
                        placeholder="請輸入教師代碼"
                        type="text"
                        value={registerForm.teacherCode}
                        onChange={(event) =>
                          registerForm.setTeacherCode(event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <input
                      className="mt-1 rounded border-slate-300 text-primary focus:ring-primary dark:border-gray-600"
                      id="terms"
                      type="checkbox"
                      required
                    />
                    <label
                      className="text-xs leading-tight text-slate-600 dark:text-gray-400"
                      htmlFor="terms"
                    >
                      我同意{" "}
                      <Link
                        className="text-primary hover:underline"
                        href="/legal/terms"
                      >
                        服務條款
                      </Link>{" "}
                      與{" "}
                      <Link
                        className="text-primary hover:underline"
                        href="/legal/privacy"
                      >
                        隱私權政策
                      </Link>
                    </label>
                  </div>

                  <button
                    className="mt-4 w-full rounded-xl bg-primary py-3.5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={registerForm.loading}
                  >
                    {registerForm.loading ? "建立中..." : "建立帳戶"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-auto hidden border-t border-[#f0f3f4] bg-white px-6 py-10 dark:border-gray-800 dark:bg-gray-900 lg:px-40">
          {/* Footer preserved as comment in original source */}
        </footer>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<FullPageLoading />}>
      <LoginContent />
    </Suspense>
  );
}
