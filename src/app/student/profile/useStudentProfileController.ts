"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { updateUserAvatar } from "@/lib/avatar";
import { useModal } from "@/components/providers/ModalContext";
import { useSchools } from "@/hooks/useSchools";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  student_code?: string;
  teacher_code?: string;
};

type EducationQueryResult = {
  department: string | null;
  degree_level: string | null;
  schools: { name: string; code: string | null } | { name: string; code: string | null }[] | null;
  education_statuses:
    | { status_key: string | null }
    | { status_key: string | null }[]
    | null;
};

export function useStudentProfileController() {
  const router = useRouter();
  const { showModal } = useModal();
  const schools = useSchools();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [school, setSchool] = useState("");
  const [status, setStatus] = useState("studying");
  const [department, setDepartment] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
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
        if (!isMounted || !userInfo) return;

        setUserProfile(userInfo as UserProfile);
        setName(userInfo.name || "");
        setEmail(userInfo.email || "");
        setPhone(userInfo.phone || "");
        setAvatarPreview(userInfo.avatar_url);

        const { data: educationData } = await supabase
          .from("student_education")
          .select(
            `
            department,
            degree_level,
            schools (name, code),
            education_statuses (status_key)
          `
          )
          .eq("student_id", user.id)
          .maybeSingle();

        if (!isMounted || !educationData) return;

        const typedEducation = educationData as EducationQueryResult;
        const schoolRelation = Array.isArray(typedEducation.schools)
          ? typedEducation.schools[0]
          : typedEducation.schools;
        const statusRelation = Array.isArray(typedEducation.education_statuses)
          ? typedEducation.education_statuses[0]
          : typedEducation.education_statuses;

        if (schoolRelation?.name) setSchool(schoolRelation.name);
        if (statusRelation?.status_key) setStatus(statusRelation.status_key);
        setDepartment(typedEducation.department || "");
        setDegreeLevel(typedEducation.degree_level || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleUpdateProfile = useCallback(async () => {
    if (!userProfile) return;

    setSaving(true);
    try {
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

      if (error) throw error;

      const matchedSchool = schools.find((item) => item.name === school);
      const schoolCode = matchedSchool ? matchedSchool.code : null;

      const { data: schoolId, error: schoolError } = await supabase.rpc(
        "get_or_create_school",
        {
          p_code: schoolCode || "",
          p_name: school,
        }
      );

      if (schoolError) throw schoolError;

      const { data: statusData, error: statusError } = await supabase
        .from("education_statuses")
        .select("id")
        .eq("status_key", status)
        .single();

      if (statusError) throw statusError;

      const { data: existingEducation } = await supabase
        .from("student_education")
        .select("id")
        .eq("student_id", userProfile.id)
        .maybeSingle();

      const educationUpdates = {
        student_id: userProfile.id,
        school_id: schoolId,
        status_id: statusData.id,
        department,
        degree_level: degreeLevel,
        updated_at: new Date().toISOString(),
      };

      const educationResult = existingEducation
        ? await supabase
            .from("student_education")
            .update(educationUpdates)
            .eq("id", existingEducation.id)
            .select()
        : await supabase.from("student_education").insert(educationUpdates).select();

      if (educationResult.error) throw educationResult.error;

      showModal({
        title: "成功",
        description: "個人資料與學歷已更新！",
        confirmText: "確定",
      });
    } catch (error) {
      console.error("Detailed update error:", error);
      showModal({
        title: "錯誤",
        description: `更新失敗: ${
          error instanceof Error ? error.message : "未知錯誤"
        } (Check Console)`,
        confirmText: "確定",
      });
    } finally {
      setSaving(false);
    }
  }, [
    degreeLevel,
    department,
    name,
    phone,
    school,
    schools,
    showModal,
    status,
    userProfile,
  ]);

  const handleUpdatePassword = useCallback(async () => {
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

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      setPasswordSuccess("密碼已更新！");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "更新失敗");
    }
  }, [confirmPassword, newPassword]);

  const handleAvatarUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || event.target.files.length === 0) return;

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
      } catch (error) {
        showModal({
          title: "錯誤",
          description: `頭像上傳失敗: ${
            error instanceof Error ? error.message : "未知錯誤"
          }`,
          confirmText: "確定",
        });
      } finally {
        setUploadingAvatar(false);
      }
    },
    [showModal, userProfile]
  );

  const showDeleteAccountNotice = useCallback(() => {
    showModal({
      title: "刪除帳戶",
      description: "請聯繫管理員刪除您的帳戶",
      confirmText: "確定",
    });
  }, [showModal]);

  return {
    fileInputRef,
    loading,
    saving,
    name,
    setName,
    email,
    phone,
    setPhone,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    passwordSuccess,
    avatarPreview,
    uploadingAvatar,
    school,
    setSchool,
    status,
    setStatus,
    department,
    setDepartment,
    degreeLevel,
    setDegreeLevel,
    openFilePicker,
    handleUpdateProfile,
    handleUpdatePassword,
    handleAvatarUpload,
    showDeleteAccountNotice,
  };
}
