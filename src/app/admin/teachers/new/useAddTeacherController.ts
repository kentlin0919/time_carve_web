"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/providers/ModalContext";
import type { Database } from "@/types/database.types";

type TeacherStatus = "active" | "disabled";

export function useAddTeacherController() {
  const router = useRouter();
  const { showModal } = useModal();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<TeacherStatus>("active");

  const toggleShowPassword = () => {
    setShowPassword((previous) => !previous);
  };

  const goBack = () => {
    router.back();
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("密碼不一致");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("密碼長度至少需 6 碼");
      setLoading(false);
      return;
    }

    try {
      const { data: emailExists, error: checkError } = await supabase.rpc(
        "admin_check_email_exists",
        { email_arg: email }
      );

      if (checkError) {
        throw new Error(`無法驗證 Email: ${checkError.message} (${checkError.code})`);
      }

      if (emailExists) {
        setError("此電子郵件已被註冊");
        setLoading(false);
        return;
      }

      const tempSupabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "teacher",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      const { error: promoteError } = await supabase.rpc("admin_promote_to_teacher", {
        target_user_id: authData.user.id,
        teacher_name: name,
        is_active: status === "active",
      });

      if (promoteError) {
        try {
          const { error: deleteError } = await supabase.rpc("admin_delete_user", {
            target_user_id: authData.user.id,
          });

          if (deleteError) {
            throw new Error(
              `新增失敗且回滾失敗: ${promoteError.message} (請聯繫管理員手動刪除帳號)`
            );
          }
        } catch (rollbackError) {
          console.error("Rollback exception:", rollbackError);
        }

        throw new Error(`新增失敗 (已自動回滾): ${promoteError.message}`);
      }

      showModal({
        title: "成功",
        description: "教師帳號新增成功！",
        confirmText: "確定",
        onConfirm: () => router.push("/admin/teachers"),
      });
    } catch (caughtError: unknown) {
      console.error("Error adding teacher:", caughtError);
      setError(
        caughtError instanceof Error ? caughtError.message : "新增失敗，請稍後再試"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
}
