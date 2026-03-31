"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";
import { AuthService } from "@/lib/application/auth/AuthService";
import { SupabaseAuthRepository } from "@/lib/infrastructure/auth/SupabaseAuthRepository";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

const authRepository = new SupabaseAuthRepository();
const authService = new AuthService(authRepository);

type AuthTab = "login" | "register";

type HeroContent = {
  imageUrl: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
};

type UserInfoSummary = Pick<
  Database["public"]["Tables"]["user_info"]["Row"],
  "identity_id" | "is_active" | "is_first_login" | "name"
>;

const DEFAULT_HERO_CONTENT: HeroContent = {
  imageUrl: "",
  titleLine1: "精選課程",
  titleLine2: "成就非凡實力",
  subtitle:
    "專為學員量身打造的專業家教課程，在舒適的環境中，開始您的學習之旅。",
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    if (!src) {
      resolve();
      return;
    }

    const image = new window.Image();
    image.src = src;
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });
}

async function fetchHeroContent() {
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
    throw error;
  }

  const settingsMap = new Map((data ?? []).map((item) => [item.key, item.value]));
  const pickValue = (key: string, fallback: string) => {
    const value = settingsMap.get(key);
    return value && value.trim() ? value : fallback;
  };

  const heroContent = {
    imageUrl: pickValue("login_hero_image_url", DEFAULT_HERO_CONTENT.imageUrl),
    titleLine1: pickValue(
      "login_hero_title_line1",
      DEFAULT_HERO_CONTENT.titleLine1
    ),
    titleLine2: pickValue(
      "login_hero_title_line2",
      DEFAULT_HERO_CONTENT.titleLine2
    ),
    subtitle: pickValue(
      "login_hero_subtitle",
      DEFAULT_HERO_CONTENT.subtitle
    ),
  };

  await preloadImage(heroContent.imageUrl);
  return heroContent;
}

async function fetchUserInfo(userId: string) {
  const result = await supabase
    .from("user_info")
    .select("is_active, is_first_login, name, identity_id")
    .eq("id", userId)
    .single();

  return {
    data: result.data as UserInfoSummary | null,
    error: result.error,
  };
}

async function checkTeacherCodeExists(teacherCode: string) {
  const { data, error } = await supabase.rpc("check_teacher_code_exists", {
    code: teacherCode.trim(),
  });

  return {
    exists: Boolean(data),
    error,
  };
}

async function checkEmailExists(email: string) {
  const { data, error } = await supabase
    .from("user_info")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return {
    exists: Boolean(data),
    error,
  };
}

function resolveIdentityRedirect(identityId: number | null, fallbackRedirect: string) {
  switch (identityId) {
    case 1:
      return "/admin/dashboard";
    case 2:
      return "/teacher/dashboard";
    case 3:
      return "/student/dashboard";
    default:
      return fallbackRedirect;
  }
}

export function useLoginPageController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { showModal } = useModal();

  const [pageReady, setPageReady] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regTeacherCode, setRegTeacherCode] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializePage = async () => {
      try {
        const nextHeroContent = await fetchHeroContent();
        if (isMounted) {
          setHeroContent(nextHeroContent);
        }
      } catch (error) {
        console.error("Error loading login hero settings:", error);
      } finally {
        if (isMounted) {
          setPageReady(true);
        }
      }
    };

    void initializePage();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

      if (authError) {
        throw authError;
      }

      const currentUser = await authService.getUser();
      const isEmailVerified = Boolean(currentUser?.emailConfirmedAt);

      if (currentUser) {
        const { data: userInfo, error: userError } = await fetchUserInfo(
          currentUser.id
        );

        if (userError) {
          console.error("Error fetching user info:", userError);
        } else if (userInfo?.is_active === false) {
          await authService.signOut();
          setLoginError("帳號已被停用，請聯繫管理員");
          return;
        }

        const isAdmin = userInfo?.identity_id === 1;

        if (!isAdmin && userInfo?.is_first_login === false) {
          if (userInfo.identity_id === 2) {
            router.push("/auth/reset-password?type=first_login");
            return;
          }

          router.push("/auth/onboarding");
          return;
        }
      }

      if (!isEmailVerified) {
        showModal({
          title: "驗證提示",
          description: "請至您的信箱收信完成驗證",
          type: "info",
        });
        return;
      }

      if (user) {
        const identityId = await authService.getIdentityId();
        router.push(resolveIdentityRedirect(identityId, redirect));
      }
    } catch (error) {
      console.error("Login Error:", error);
      setLoginError(getErrorMessage(error, "登入失敗，請稍後再試"));
    } finally {
      setLoginLoading(false);
    }
  };

  const resetRegisterForm = () => {
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setRegConfirm("");
    setRegTeacherCode("");
    setRegError(null);
    setActiveTab("login");
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (regPassword !== regConfirm) {
      setRegError("密碼不一致");
      return;
    }

    setRegLoading(true);
    setRegError(null);

    try {
      const { exists: teacherExists, error: teacherError } =
        await checkTeacherCodeExists(regTeacherCode);

      if (teacherError) {
        console.error("Error checking teacher code:", teacherError);
        setRegError("驗證教師代碼時發生錯誤");
        return;
      }

      if (!teacherExists) {
        setRegError("無效的教師代碼");
        return;
      }

      const { exists: emailExists, error: emailError } = await checkEmailExists(
        regEmail
      );

      if (emailError) {
        console.error("Error checking email:", emailError);
        setRegError("驗證 Email 時發生錯誤");
        return;
      }

      if (emailExists) {
        setRegError("此電子郵件已被註冊");
        return;
      }

      const { error } = await authService.signUp({
        email: regEmail,
        password: regPassword,
        name: regName,
        teacherCode: regTeacherCode,
      });

      if (error) {
        throw error;
      }

      showModal({
        title: "註冊成功",
        description: "請檢查您的電子信箱以進行驗證。",
        type: "success",
        confirmText: "前往登入",
        onConfirm: resetRegisterForm,
      });
    } catch (error) {
      console.error("Register Error:", error);
      setRegError(getErrorMessage(error, "註冊失敗，請稍後再試"));
    } finally {
      setRegLoading(false);
    }
  };

  return {
    pageReady,
    activeTab,
    setActiveTab,
    heroContent,
    loginForm: {
      email: loginEmail,
      setEmail: setLoginEmail,
      password: loginPassword,
      setPassword: setLoginPassword,
      loading: loginLoading,
      error: loginError,
      onSubmit: handleLogin,
    },
    registerForm: {
      name: regName,
      setName: setRegName,
      email: regEmail,
      setEmail: setRegEmail,
      password: regPassword,
      setPassword: setRegPassword,
      confirmPassword: regConfirm,
      setConfirmPassword: setRegConfirm,
      teacherCode: regTeacherCode,
      setTeacherCode: setRegTeacherCode,
      loading: regLoading,
      error: regError,
      onSubmit: handleRegister,
    },
  };
}
