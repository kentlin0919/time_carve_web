"use client";
import { supabase } from "@/lib/supabase";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AuthService } from "@/lib/application/auth/AuthService";
import { SupabaseAuthRepository } from "@/lib/infrastructure/auth/SupabaseAuthRepository";
import EducationInputs from "@/components/ui/EducationInputs";
import { useSchools } from "@/hooks/useSchools";
import { useModal } from "@/components/providers/ModalContext";

const authRepository = new SupabaseAuthRepository();
const authService = new AuthService(authRepository);

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { showModal } = useModal();
  // const schools = useSchools();

  // State for Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // State for Register
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regTeacherCode, setRegTeacherCode] = useState("");

  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroTitleLine1, setHeroTitleLine1] = useState("精選課程");
  const [heroTitleLine2, setHeroTitleLine2] = useState("成就非凡實力");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "專為學員量身打造的專業家教課程，在舒適的環境中，開始您的學習之旅。"
  );

  useEffect(() => {
    let isMounted = true;
    const loadHeroSettings = async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", [
          "login_hero_image_url",
          "login_hero_title_line1",
          "login_hero_title_line2",
          "login_hero_subtitle",
        ]);

      if (error) {
        console.error("Error loading login hero settings:", error);
        return;
      }

      if (!isMounted) return;

      const map = new Map((data || []).map((item) => [item.key, item.value]));
      const pick = (key: string, fallback: string) => {
        const value = map.get(key);
        return value && value.trim() ? value : fallback;
      };

      setHeroImageUrl(pick("login_hero_image_url", ""));
      setHeroTitleLine1(pick("login_hero_title_line1", "精選課程"));
      setHeroTitleLine2(pick("login_hero_title_line2", "成就非凡實力"));
      setHeroSubtitle(
        pick(
          "login_hero_subtitle",
          "專為學員量身打造的專業家教課程，在舒適的環境中，開始您的學習之旅。"
        )
      );
    };

    loadHeroSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const { user, error: authError } = await authService.signIn({
        email: loginEmail,
        password: loginPassword,
      });

      if (
        authError?.name === "AuthApiError" &&
        authError.message === "Invalid login credentials"
      ) {
        setLoginError("Invalid login credentials");
        return;
      }

      // Check if email verified
      const currentUser = await authService.getUser();
      const isEmailVerified = !!currentUser?.emailConfirmedAt;

      // Check if account is active
      if (currentUser) {
        const { data: userInfo, error: userError } = await (
          supabase.from("user_info" as any) as any
        )
          .select("is_active, is_first_login, name, identity_id")
          .eq("id", currentUser.id)
          .single();

        if (userError) {
          console.error("Error fetching user info:", userError);
          // Optional: handle error, maybe fail open or closed?
          // For now, let's allow login if we can't check, or fail?
          // Safest is to log it and proceed if we can't definitively say they are inactive,
          // OR fail if critical. Let's assume proceed but log error for now unless strict.
        } else if (userInfo && userInfo.is_active === false) {
          await authService.signOut();
          setLoginError("帳號已被停用，請聯繫管理員");
          setLoginLoading(false);
          return;
        }

        const isAdmin = userInfo?.identity_id === 1;

        if (!isAdmin) {
          // Check if first login (is_first_login === false means setup not done)
          // For Teachers (identity_id === 2), force password change
          if (
            userInfo &&
            userInfo.is_first_login === false &&
            userInfo.identity_id === 2
          ) {
            router.push("/auth/reset-password?type=first_login");
            return;
          }

          // For Students or others, go to Onboarding
          if (userInfo && userInfo.is_first_login === false) {
            router.push("/auth/onboarding");
            return;
          }

          // Check if profile incomplete
          if (userInfo && !userInfo.name && userInfo.is_first_login === false) {
            router.push("/auth/onboarding");
            return;
          }
        }
      }

      console.log("Email Verified:", isEmailVerified);

      if (!isEmailVerified) {
        /// 跳出視窗提示去 email 收信
        showModal({
          title: "驗證提示",
          description: "請至您的信箱收信完成驗證",
          type: "info",
        });
        return;
      }

      if (user) {
        // Get identity ID
        console.log("Fetching identity_id...");
        const identityId = await authService.getIdentityId();

        console.log("Identity ID:", identityId);

        // Redirect based on identity_id
        switch (identityId) {
          case 1: // Super Admin
            router.push("/admin/dashboard");
            break;
          case 2: // Teacher
            router.push("/teacher/dashboard");
            break;
          case 3: // Student
            router.push("/student/dashboard");
            break;
          default:
            router.push(redirect);
        }
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      setLoginError(error.message || "登入失敗，請稍後再試");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      setRegError("密碼不一致");
      return;
    }

    setRegLoading(true);
    setRegError(null);

    try {
      // 1. Check if teacher_code exists (using RPC to bypass RLS)
      const { data: teacherExists, error: teacherError } = await supabase.rpc(
        "check_teacher_code_exists",
        { code: regTeacherCode.trim() }
      );

      if (teacherError) {
        console.error("Error checking teacher code:", teacherError);
        setRegError("驗證教師代碼時發生錯誤");
        setRegLoading(false);
        return;
      }

      if (!teacherExists) {
        setRegError("無效的教師代碼");
        setRegLoading(false);
        return;
      }

      // 2. Check if email already exists
      const { data: existingUser, error: existingUserError } = await (
        supabase.from("user_info" as any) as any
      )
        .select("id")
        .eq("email", regEmail)
        .maybeSingle();

      if (existingUserError) {
        console.error("Error checking email:", existingUserError);
        setRegError("驗證 Email 時發生錯誤");
        setRegLoading(false);
        return;
      }

      // If we find a user, it's a duplicate.
      if (existingUser) {
        setRegError("此電子郵件已被註冊");
        setRegLoading(false);
        return;
      }

      const { error } = await authService.signUp({
        email: regEmail,
        password: regPassword,
        name: regName,
        teacherCode: regTeacherCode,
      });

      if (error) throw error;

      showModal({
        title: "註冊成功",
        description: "請檢查您的電子信箱以進行驗證。",
        type: "success",
        confirmText: "前往登入",
        onConfirm: () => {
          setRegName("");
          setRegEmail("");
          setRegPassword("");
          setRegConfirm("");
          setRegTeacherCode("");
          setActiveTab("login");
          setRegError(null);
        },
      });
    } catch (error: any) {
      console.error("Register Error:", error);
      setRegError(error.message || "註冊失敗，請稍後再試");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-[#111618] dark:text-white font-display antialiased selection:bg-primary/20">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f3f4] dark:border-b-gray-800 px-6 lg:px-10 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4 text-[#111618] dark:text-white">
          <div className="relative size-8">
            <Image
              src="/logo.svg"
              alt="TimeCarve Logo"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-[#111618] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            TimeCarve 刻時
          </h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <div className="hidden lg:flex items-center gap-9">
            <Link
              className="text-[#111618] dark:text-gray-200 text-sm font-medium leading-normal hover:text-primary transition-colors"
              href="/"
            >
              首頁
            </Link>
            <Link
              className="text-[#111618] dark:text-gray-200 text-sm font-medium leading-normal hover:text-primary transition-colors"
              href="/courses"
            >
              課程列表
            </Link>
            <Link
              className="text-[#111618] dark:text-gray-200 text-sm font-medium leading-normal hover:text-primary transition-colors"
              href="/teachers"
            >
              師資介紹
            </Link>
            <Link
              className="text-[#111618] dark:text-gray-200 text-sm font-medium leading-normal hover:text-primary transition-colors"
              href="#"
            >
              聯絡我們
            </Link>
          </div>
          <div className="flex gap-4 items-center">
            <button className="lg:hidden text-[#111618] dark:text-white">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 bg-gradient-to-br from-background-light to-blue-50/50 dark:from-background-dark dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 dark:border-gray-700/50 overflow-hidden w-full max-w-5xl flex flex-col md:flex-row min-h-[640px]">
          {heroImageUrl && (
            <div
              className="hidden md:flex flex-col justify-between w-1/2 bg-cover bg-center relative p-12 text-white"
              style={{
                backgroundImage: `url("${heroImageUrl}")`,
              }}
            >
              <div className="absolute inset-0 bg-primary/80 mix-blend-multiply opacity-90 dark:opacity-80"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10"></div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-12">
                  <div className="size-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-lg">
                    <span className="material-symbols-outlined text-3xl">
                      school
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight">
                    {heroTitleLine1}
                    <br />
                    {heroTitleLine2}
                  </h2>
                  <p className="text-lg text-white/90 leading-relaxed">
                    {heroSubtitle}
                  </p>
                </div>
                {/* Reviews removed as per request */}
              </div>
            </div>
          )}
          <div
            className={`w-full p-8 lg:p-12 relative flex flex-col justify-center bg-white dark:bg-gray-800 ${
              heroImageUrl ? "md:w-1/2" : ""
            }`}
          >
            <div className="relative w-full max-w-sm mx-auto">
              {/* Note: defaultChecked in React replaces checked attribute */}
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
              <div className="flex justify-center mb-8 gap-6 border-b border-slate-100 dark:border-gray-700 relative">
                <label
                  className="cursor-pointer pb-3 text-lg font-bold text-slate-400 dark:text-gray-500 transition-all hover:text-slate-600 dark:hover:text-gray-300 peer-checked/login:text-primary dark:peer-checked/login:text-primary peer-checked/login:border-b-2 peer-checked/login:border-primary peer-checked/login:-mb-[2px]"
                  htmlFor="tab-login"
                >
                  登入
                </label>
                <label
                  className="cursor-pointer pb-3 text-lg font-bold text-slate-400 dark:text-gray-500 transition-all hover:text-slate-600 dark:hover:text-gray-300 peer-checked/register:text-primary dark:peer-checked/register:text-primary peer-checked/register:border-b-2 peer-checked/register:border-primary peer-checked/register:-mb-[2px]"
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
                <form className="space-y-5" onSubmit={handleLogin}>
                  {loginError && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      {loginError}
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
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                        mail
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium"
                        id="login-email"
                        placeholder="name@example.com"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label
                        className="text-sm font-bold text-slate-700 dark:text-gray-300"
                        htmlFor="login-password"
                      >
                        密碼
                      </label>
                      <Link
                        className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                        href="/auth/forgot-password"
                      >
                        忘記密碼？
                      </Link>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                        lock
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium"
                        id="login-password"
                        placeholder="••••••••"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="rounded border-slate-300 dark:border-gray-600 text-primary focus:ring-primary"
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
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loginLoading}
                  >
                    <span>{loginLoading ? "登入中..." : "立即登入"}</span>
                    {!loginLoading && (
                      <span className="material-symbols-outlined text-[20px]">
                        arrow_forward
                      </span>
                    )}
                  </button>
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-800 px-2 text-slate-400">
                        或使用以下方式登入
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-3 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-slate-700 dark:text-gray-300"
                    >
                      {/* Google 官方四色 Logo SVG */}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 48 48"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
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
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-xs leading-relaxed flex gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    info
                  </span>
                  <p>
                    此註冊通道僅供<strong>課程學員</strong>
                    使用。教師帳號請聯繫管理員建立。
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handleRegister}>
                  {regError && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">
                      {regError}
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
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                        person
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium"
                        id="reg-name"
                        placeholder="您的真實姓名"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
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
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                        mail
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium"
                        id="reg-email"
                        placeholder="name@example.com"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
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
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                          lock
                        </span>
                        <input
                          className="block w-full rounded-xl border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium"
                          id="reg-password"
                          placeholder="••••••"
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
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
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                          lock_reset
                        </span>
                        <input
                          className="block w-full rounded-xl border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium"
                          id="reg-confirm"
                          placeholder="••••••"
                          type="password"
                          value={regConfirm}
                          onChange={(e) => setRegConfirm(e.target.value)}
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
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
                        key
                      </span>
                      <input
                        className="block w-full rounded-xl border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 pl-10 pr-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-primary focus:bg-white dark:focus:bg-gray-700 transition-all text-sm font-medium"
                        id="reg-teacher-code"
                        placeholder="請輸入教師代碼"
                        type="text"
                        value={regTeacherCode}
                        onChange={(e) => setRegTeacherCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <input
                      className="mt-1 rounded border-slate-300 dark:border-gray-600 text-primary focus:ring-primary"
                      id="terms"
                      type="checkbox"
                      required
                    />
                    <label
                      className="text-xs text-slate-600 dark:text-gray-400 leading-tight"
                      htmlFor="terms"
                    >
                      我同意{" "}
                      <a
                        className="text-primary hover:underline"
                        href="/legal/terms"
                      >
                        服務條款
                      </a>{" "}
                      與{" "}
                      <a
                        className="text-primary hover:underline"
                        href="/legal/privacy"
                      >
                        隱私權政策
                      </a>
                    </label>
                  </div>
                  <button
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={regLoading}
                  >
                    {regLoading ? "建立中..." : "建立帳戶"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <footer className="bg-white dark:bg-gray-900 border-t border-[#f0f3f4] dark:border-gray-800 py-10 px-6 lg:px-40 mt-auto hidden">
          {/* Footer preserved as comment in original source */}
        </footer>
      </div>
      {/* Hidden Datalist for Schools removed in favor of SchoolCombobox */}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
