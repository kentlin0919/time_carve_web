"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

type ResetUserInfo = Pick<
  Database["public"]["Tables"]["user_info"]["Row"],
  "identity_id" | "is_first_login"
>;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "重設失敗，請稍後再試";
}

async function fetchResetUserInfo(userId: string) {
  const result = await supabase
    .from("user_info")
    .select("is_first_login, identity_id")
    .eq("id", userId)
    .single();

  return {
    data: result.data as ResetUserInfo | null,
    error: result.error,
  };
}

export function useResetPasswordController() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramType = params.get("type");
    setType(paramType);

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (paramType === "first_login" && !session) {
        router.push("/auth/login");
      }
    };

    void checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          console.log("Password recovery session active");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
    password
  );

  const isStrongPassword = useMemo(
    () => (value: string) =>
      value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value),
    []
  );

  const strengthScore =
    (hasMinLength ? 1 : 0) +
    (hasUppercase ? 1 : 0) +
    (hasNumberOrSymbol ? 1 : 0);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const canSubmit = !loading && isStrongPassword(password) && passwordsMatch;

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isStrongPassword(password)) {
      setError("密碼強度不足，請符合提示條件");
      return;
    }

    if (password !== confirmPassword) {
      setError("新密碼確認不一致");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("密碼重設成功！即將跳轉...");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let redirectPath = "/auth/login";

      if (user) {
        const { data: userInfo, error: userInfoError } = await fetchResetUserInfo(
          user.id
        );

        if (!userInfoError && userInfo?.is_first_login === false) {
          redirectPath = "/auth/onboarding";
        }
      }

      if (type === "first_login") {
        redirectPath = "/auth/onboarding";
      }

      setTimeout(() => {
        router.push(redirectPath);
      }, 1500);
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setLoading(false);
    }
  };

  return {
    form: {
      password,
      setPassword,
      confirmPassword,
      setConfirmPassword,
      loading,
      error,
      message,
      canSubmit,
      onSubmit: handleUpdatePassword,
    },
    passwordRules: {
      hasMinLength,
      hasUppercase,
      hasNumberOrSymbol,
      strengthScore,
      passwordsMatch,
    },
    visibility: {
      showPassword,
      setShowPassword,
      showConfirmPassword,
      setShowConfirmPassword,
    },
  };
}
