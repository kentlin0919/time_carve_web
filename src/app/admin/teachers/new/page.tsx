"use client";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Database } from "@/types/database.types";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";

export default function AddTeacherPage() {
  const router = useRouter();
  const { showModal } = useModal();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Plan is currently just UI in the form, we can store it in metadata if needed,
  // currently DB schema might not have 'plan' column on teacher_info or user_info.
  // We'll focus on creating the teacher first. The prompt didn't ask for Plan DB schema changes.
  const [status, setStatus] = useState("active"); // active | disabled

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Validation
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
      // 1.5 Check if email already exists (using RPC)
      // We use the admin client (supabase) to check, because authorized client can call the secure RPC
      const { data: emailExists, error: checkError } = await supabase.rpc(
        "admin_check_email_exists",
        {
          email_arg: email,
        }
      );

      if (checkError) {
        console.error("Email check failed:", checkError);
        throw new Error(
          `無法驗證 Email: ${checkError.message} (${checkError.code})`
        );
      }

      if (emailExists) {
        setError("此電子郵件已被註冊");
        setLoading(false);
        return;
      }

      // 2. Create a temporary Supabase client to create the new user
      // We do this to avoid logging out the current admin user.
      const tempSupabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
        {
          auth: {
            persistSession: false, // Critical: Do not persist this session
            autoRefreshToken: false,
          },
        }
      );

      // 3. Helper: Sign up the teacher
      const { data: authData, error: authError } =
        await tempSupabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              role: "teacher",
            },
          },
        });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // 4. Promote to Teacher (using Admin RPC)
      // The new user is created as Student (id=3) by default trigger.
      // We verify ourselves as Admin and call the RPC to promote them.
      const { error: rpcError } = await supabase.rpc(
        "admin_promote_to_teacher",
        {
          target_user_id: authData.user.id,
          teacher_name: name,
          is_active: status === "active",
        }
      );

      if (rpcError) {
        console.error("Promotion failed:", rpcError);

        // --- ROLLBACK LOGIC ---
        // If promotion fails, we must delete the user we just created to avoid
        // leaving a "Student" account with the teacher's email.
        console.log("Initiating rollback: Deleting incomplete user account...");
        try {
          const { error: deleteError } = await supabase.rpc(
            "admin_delete_user",
            {
              target_user_id: authData.user.id,
            }
          );

          if (deleteError) {
            console.error(
              "Rollback failed! User may still exist:",
              deleteError
            );
            throw new Error(
              `新增失敗且回滾失敗: ${rpcError.message} (請聯繫管理員手動刪除帳號)`
            );
          } else {
            console.log("Rollback successful: User deleted.");
          }
        } catch (rollbackErr) {
          console.error("Rollback exception:", rollbackErr);
          // Don't overwrite the original error, but maybe append info
        }
        // ----------------------

        throw new Error(`新增失敗 (已自動回滾): ${rpcError.message}`);
      }

      // Success
      showModal({
        title: "成功",
        description: "教師帳號新增成功！",
        confirmText: "確定",
        onConfirm: () => router.push("/admin/teachers"),
      });
    } catch (err: any) {
      console.error("Error adding teacher:", err);
      setError(err.message || "新增失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 px-6 py-8 md:px-12 md:py-10 max-w-[1000px] mx-auto w-full">
      <div className="mb-6">
        <Link
          href="/admin/teachers"
          className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-sky-500 transition-colors group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          <span className="text-sm font-bold">返回教師列表</span>
        </Link>
      </div>

      <header className="mb-10">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          新增教師
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base">
          填寫以下資訊以為牙牙學語系統建立新的教師帳號。
        </p>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-10">
        <form onSubmit={handleRegister} className="flex flex-col gap-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-sky-500"></span>
              基本資料
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  教師姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400/60 transition-all outline-none"
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400/60 transition-all outline-none"
                  placeholder="name@example.com"
                  required
                  type="email"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  初始密碼 <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400/60 transition-all outline-none"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sky-500 transition-colors"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                  密碼長度須至少 6 碼。
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  確認密碼 <span className="text-red-500">*</span>
                </label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400/60 transition-all outline-none"
                  placeholder="請再次輸入密碼"
                  required
                  type="password"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* Permissions and Plans */}
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-sky-500"></span>
              權限與方案
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  維護費方案 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full h-12 px-4 pr-10 appearance-none rounded-xl bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-0 text-gray-900 dark:text-white cursor-pointer outline-none transition-all"
                    defaultValue="pro"
                  >
                    <option value="basic">基礎版 (Basic)</option>
                    <option value="pro">專業版 (Pro)</option>
                    <option value="enterprise">企業版 (Enterprise)</option>
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 pointer-events-none text-sm">
                    expand_more
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                  不同方案將影響教師可開設的課程數量上限。
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">
                  初始狀態
                </label>
                <div className="flex items-center gap-4 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 border-2 border-transparent">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      checked={status === "active"}
                      onChange={() => setStatus("active")}
                      className="size-4 text-sky-500 focus:ring-sky-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      name="status"
                      type="radio"
                      value="active"
                    />
                    <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-sky-500 transition-colors">
                      啟用帳號
                    </span>
                  </label>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-700"></div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      checked={status === "disabled"}
                      onChange={() => setStatus("disabled")}
                      className="size-4 text-gray-400 focus:ring-gray-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      name="status"
                      type="radio"
                      value="disabled"
                    />
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      暫時禁用
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 mt-4 pt-6 text-right border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => router.back()}
              className="h-12 px-6 rounded-xl border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold transition-colors"
              type="button"
            >
              取消
            </button>
            <button
              disabled={loading}
              className="h-12 px-8 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  sync
                </span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">
                  check
                </span>
              )}
              <span>{loading ? "處理中..." : "確認新增"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
