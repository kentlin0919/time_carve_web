"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { updateUserAvatar } from "@/lib/avatar";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";
import EducationInputs from "@/components/ui/EducationInputs";
import { useSchools } from "@/hooks/useSchools";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  student_code?: string;
  teacher_code?: string;
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { showModal } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Use shared hook for school data (for validation in handleSave)
  const schools = useSchools();

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState(""); // Note: 'bio' is not in user_info/student_info schema, might need to be stored elsewhere or omitted if not supported. I will mock it or use local state for now as it's in the design. actually teacher_info has bio, student doesn't. I'll omit or check if I should add it.
  // Wait, the design has "School/Grade" and "Bio". Database `student_info` has `student_code`, `teacher_code`. `user_info` has `name`, `email`, `phone`, `avatar_url`.
  // I will map "School/Grade" to a placeholder or `student_code` if appropriate, but `student_code` seems to be an ID.
  // For now I will keep "School/Grade" and "Bio" as UI-only or store in metadata if needed, but to strictly follow DB I should probably omit or clarify.
  // Actually, I'll store "School/Grade" and "Bio" in `user_metadata` for now if they don't exist in columns, OR just wire up the existing columns: Name, Email, Phone.
  // Let's stick to real columns `name`, `phone`, `avatar_url`.

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Avatar State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Education State
  const [school, setSchool] = useState("");
  const [status, setStatus] = useState("studying");
  const [department, setDepartment] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: userInfo, error } = await supabase
        .from("user_info")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (userInfo) {
        setUserProfile(userInfo as any);
        setName(userInfo.name || "");
        setEmail(userInfo.email || "");
        setPhone(userInfo.phone || "");
        setAvatarPreview(userInfo.avatar_url);

        // Fetch Education
        const { data: eduData } = await supabase
          .from("student_education")
          .select(
            `
            *,
            schools (name, code),
            education_statuses (status_key)
          `
          )
          .eq("student_id", user.id)
          .maybeSingle();

        if (eduData) {
          if (eduData.schools) {
            // @ts-ignore
            setSchool(eduData.schools.name);
          }
          if (eduData.education_statuses) {
            // @ts-ignore
            setStatus(eduData.education_statuses.status_key);
          }
          setDepartment(eduData.department || "");
          setDegreeLevel(eduData.degree_level || "");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userProfile) return;
    setSaving(true);
    try {
      console.log("Starting profile update...");

      // 1. Update basic info
      const updates = {
        id: userProfile.id,
        name,
        phone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_info")
        .update(updates)
        .eq("id", userProfile.id);

      if (error) {
        console.error("Basic info update error:", error);
        throw error;
      }

      // 2. Update Education
      console.log("Updating education with:", { school, status, department, degreeLevel });

      // Get/Create School ID
      const matchedSchool = schools.find((s) => s.name === school);
      const schoolCode = matchedSchool ? matchedSchool.code : null;

      const { data: schoolId, error: schoolError } = await supabase.rpc(
        "get_or_create_school",
        {
          p_code: schoolCode || "",
          p_name: school,
        }
      );

      if (schoolError) {
        console.error("School error:", schoolError);
        throw schoolError;
      }
      console.log("School ID resolved:", schoolId);

      // Get Status ID
      const { data: statusData, error: statusError } = await supabase
        .from("education_statuses")
        .select("id")
        .eq("status_key", status)
        .single();

      if (statusError) {
        console.error("Status lookup error:", statusError);
        throw statusError;
      }
      console.log("Status ID resolved:", statusData.id);

      // Upsert Student Education
      const { data: existingEdu } = await supabase
        .from("student_education")
        .select("id")
        .eq("student_id", userProfile.id)
        .maybeSingle();

      console.log("Existing education record:", existingEdu);

      const eduUpdates = {
        student_id: userProfile.id,
        school_id: schoolId,
        status_id: statusData.id,
        department: department,
        degree_level: degreeLevel,
        updated_at: new Date().toISOString(),
      };

      let eduResult;
      if (existingEdu) {
        console.log("Updating existing education:", existingEdu.id);
        eduResult = await supabase
          .from("student_education")
          .update(eduUpdates)
          .eq("id", existingEdu.id)
          .select();
      } else {
        console.log("Inserting new education...");
        eduResult = await supabase
          .from("student_education")
          .insert(eduUpdates)
          .select();
      }

      console.log("Education update result:", eduResult);

      if (eduResult.error) {
        console.error("Education update error:", eduResult.error);
        throw eduResult.error;
      }

      showModal({
        title: "成功",
        description: "個人資料與學歷已更新！",
        confirmText: "確定",
      });
    } catch (error: any) {
      console.error("Detailed update error:", error);
      showModal({
        title: "錯誤",
        description: "更新失敗: " + error.message + " (Check Console)",
        confirmText: "確定",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("新密碼與確認密碼不符");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("密碼長度至少需 6 個字元");
      return;
    }

    // Note: Supabase implementation usually requires re-auth for password change if checking old password,
    // but `updateUser` with new password works if session is active.
    // Validating `currentPassword` is not directly supported by `updateUser` without signIn.
    // For this implementation, I will just update to new password.

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setPasswordSuccess("密碼已更新！");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(error.message);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    setUploadingAvatar(true);
    try {
      if (userProfile) {
        const publicUrl = await updateUserAvatar({
          userId: userProfile.id,
          file,
        });
        setAvatarPreview(publicUrl);
        showModal({
          title: "成功",
          description: "頭像更新成功！",
          confirmText: "確定",
        });
      }
    } catch (error: any) {
      showModal({
        title: "錯誤",
        description: "頭像上傳失敗: " + error.message,
        confirmText: "確定",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center">載入中...</div>;
  }

  return (
    <div className="container mx-auto max-w-[1024px] p-6 md:p-10 flex flex-col gap-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-slate-900 dark:text-white text-3xl font-display font-black leading-tight tracking-tight mb-2">
            個人帳戶設定
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            管理您的個人資料、頭像設定、登入密碼以及系統通知偏好
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[20px]">
              help_center
            </span>
            <span className="hidden sm:inline">需要協助？</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-6 sticky top-10">
          <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-br from-primary/10 to-secondary/10 z-0"></div>
            <div className="relative z-10 flex flex-col items-center w-full">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white self-start mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  face
                </span>
                頭像設定
              </h2>
              <div className="w-full flex flex-col items-center gap-6">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="size-44 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden relative ring-4 ring-primary/20 bg-slate-100">
                    <img
                      alt="Profile Preview"
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                      src={
                        avatarPreview ||
                        `https://ui-avatars.com/api/?name=${name || "User"
                        }&background=random`
                      }
                    />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-slate-800 text-white p-2.5 rounded-full shadow-lg border-2 border-white dark:border-slate-700 hover:scale-110 hover:bg-primary transition-all duration-300">
                    <span className="material-symbols-outlined text-[20px]">
                      photo_camera
                    </span>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />

                <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all shadow-sm disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        upload
                      </span>
                      {uploadingAvatar ? "上傳中..." : "上傳新圖"}
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-slate-400 px-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">
                    info
                  </span>
                  <p className="text-xs leading-relaxed">
                    建議尺寸 500x500 像素。支援 JPG, PNG 格式 (最大 2MB)。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/20">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-500 mt-1">
                info
              </span>
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1">
                  完成個人資料
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  填寫完整的聯絡資訊有助於我們在課程變動時第一時間通知您。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Basic Info */}
          <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  基本資料
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  更新您的姓名與聯絡方式
                </p>
              </div>
              <button
                onClick={handleUpdateProfile}
                disabled={saving}
                className="text-primary hover:text-primary-dark text-sm font-bold trans-all disabled:opacity-50"
              >
                {saving ? "儲存中..." : "儲存變更"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  真實姓名
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 font-medium focus:border-primary focus:ring-primary trans-all"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  電子郵件
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-4 py-2.5 font-medium cursor-not-allowed"
                  type="email"
                  value={email}
                  disabled
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  手機號碼
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 font-medium focus:border-primary focus:ring-primary trans-all"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-400">
                  學歷資料
                </span>
              </div>
            </div>

            <div className="mt-4">
              <EducationInputs
                school={school}
                setSchool={setSchool}
                status={status}
                setStatus={setStatus}
                department={department}
                setDepartment={setDepartment}
                degreeLevel={degreeLevel}
                setDegreeLevel={setDegreeLevel}
                labels={{
                  school: "就讀學校",
                  status: "就學狀態",
                  department: "科系/所",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  帳戶安全
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  定期更改密碼以保護您的帳戶
                </p>
              </div>
            </div>
            <div className="space-y-6 max-w-lg">
              {/* Current password field is tricky without re-auth, so specific 'change password' usually just asks for new one if already logged in, or asks for old one to re-authenticate. Simple version here. */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    新密碼
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 font-medium focus:border-primary focus:ring-primary trans-all"
                    placeholder="請輸入新密碼"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    確認新密碼
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 font-medium focus:border-primary focus:ring-primary trans-all"
                    placeholder="再次輸入新密碼"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-green-500 text-sm">{passwordSuccess}</p>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  className="bg-slate-800 hover:bg-slate-900 dark:bg-primary dark:hover:bg-primary-dark dark:text-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-200 dark:shadow-none transition-all flex items-center gap-2"
                >
                  更新密碼
                </button>
              </div>
            </div>
          </div>

          {/* Notifications (UI Only for now) */}
          <div className="bg-surface-light dark:bg-surface-dark bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-soft p-6 md:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                通知偏好
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                自定義您希望接收的訊息類型
              </p>
            </div>
            <div className="space-y-6 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-200">
                    課程提醒
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    在上課前 24 小時發送 Email 與簡訊提醒
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    defaultChecked
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between pt-6">
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-200">
                    學習進度報告
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    每週寄送一次您的練習時數與課程進度總結
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    defaultChecked
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-4 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-red-500 font-bold mb-2">危險區域</h3>
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-xl">
              <div>
                <h4 className="font-bold text-red-600 dark:text-red-400 text-sm">
                  刪除帳戶
                </h4>
                <p className="text-xs text-red-400/80 mt-0.5">
                  此動作無法復原，您的所有課程進度將被永久刪除。
                </p>
              </div>
              <button
                className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg text-sm font-bold trans-all"
                onClick={() =>
                  showModal({
                    title: "刪除帳戶",
                    description: "請聯繫管理員刪除您的帳戶",
                    confirmText: "確定",
                  })
                }
              >
                刪除帳戶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
