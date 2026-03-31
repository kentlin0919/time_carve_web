"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { buildPasswordRecoveryRedirect } from "@/lib/supabase/authRedirect";

type VerifyType = "signup" | "recovery" | "magiclink" | "invite";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function useVerifyController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "student@example.com";
  const type = (searchParams.get("type") as VerifyType) || "signup";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((previous) => previous - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timer]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = value;
    setOtp(nextOtp);

    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").slice(0, 6).split("");
    const nextOtp = [...otp];

    pastedData.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        nextOtp[index] = char;
      }
    });

    setOtp(nextOtp);

    const nextEmptyIndex = nextOtp.findIndex((value) => value === "");
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
      return;
    }

    inputRefs.current[5]?.focus();
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = otp.join("");

    if (token.length !== 6) {
      setError("請輸入完整 6 位數驗證碼");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (verifyError) {
        throw verifyError;
      }

      if (type === "recovery") {
        router.push("/auth/reset-password");
        return;
      }

      router.push("/student/courses");
    } catch (verifyError) {
      setError(getErrorMessage(verifyError, "驗證失敗，請檢查驗證碼是否正確"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) {
      return;
    }

    try {
      setLoading(true);

      if (type === "recovery") {
        const redirectTo = buildPasswordRecoveryRedirect(window.location.origin);
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
          email,
          { redirectTo }
        );

        if (recoveryError) {
          throw recoveryError;
        }
      } else {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email,
        });

        if (resendError) {
          throw resendError;
        }
      }

      setTimer(300);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setError(null);
    } catch (resendError) {
      console.error("Verification resend failed", {
        error: resendError,
      });
      setError(getErrorMessage(resendError, "發送失敗"));
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    otp,
    loading,
    error,
    formattedTime,
    canResend,
    inputRefs,
    onChangeOtp: handleOtpChange,
    onOtpKeyDown: handleOtpKeyDown,
    onOtpPaste: handleOtpPaste,
    onSubmit: handleVerify,
    onResend: handleResend,
  };
}
