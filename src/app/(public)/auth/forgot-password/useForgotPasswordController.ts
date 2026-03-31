"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { buildPasswordRecoveryRedirect } from "@/lib/supabase/authRedirect";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "發送失敗，請稍後再試。";
}

export function useForgotPasswordController() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const redirectTo = buildPasswordRecoveryRedirect(window.location.origin);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo }
      );

      if (resetError) {
        throw resetError;
      }

      setMessage("已寄出重設密碼連結，正在為您跳轉...");
      router.push("/");
    } catch (requestError) {
      console.error("Password recovery request failed", {
        error: requestError,
      });
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return {
    form: {
      email,
      setEmail,
      loading,
      message,
      error,
      onSubmit: handleResetPassword,
    },
  };
}
