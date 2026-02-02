"use client";

import { useEffect, useRef, useState } from "react";
import { TeacherProfile, TeacherEducation } from "@/lib/domain/teacher/entity";
import { useModal } from "@/components/providers/ModalContext";
import Image from "next/image";
import { updateUserAvatar } from "@/lib/avatar";
import { ExperienceSection } from "./components/ExperienceSection";
import { useSchools } from "@/hooks/useSchools";
import SchoolCombobox from "@/components/ui/SchoolCombobox";
import { supabase } from "@/lib/supabase";

interface Props {
  initialProfile: TeacherProfile;
  onSave: (profile: Partial<TeacherProfile>) => Promise<void>;
  onAddEducation: (
    edu: Omit<TeacherEducation, "id" | "teacherId">
  ) => Promise<TeacherEducation | null>;
  onDeleteEducation: (id: string) => Promise<void>;
  onRefresh: () => void; // Callback to refresh data
}

import { DEGREE_LEVELS } from "@/lib/constants";


export default function TeacherProfileForm({
  initialProfile,
  onSave,
  onAddEducation,
  onDeleteEducation,
  onRefresh,
}: Props) {
  const iconOptions = [
    "psychology",
    "visibility",
    "handshake",
    "lightbulb",
    "school",
    "auto_awesome",
    "emoji_objects",
    "insights",
    "diversity_3",
    "construction",
    "menu_book",
    "self_improvement",
  ];
  const [profile, setProfile] = useState<TeacherProfile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Education State
  const schools = useSchools();
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [addingEduLoading, setAddingEduLoading] = useState(false);
  const [newEdu, setNewEdu] = useState({
    schoolName: "",
    degree: "",
    degreeLevel: "bachelor",
    department: "",
    startYear: "",
    endYear: "",
    statusId: "1",
  });
  const [educationStatuses, setEducationStatuses] = useState<
    { id: number; label: string }[]
  >([]);

  useEffect(() => {
    supabase
      .from("education_statuses")
      .select("id, label_zh")
      .order("id")
      .then(({ data }) => {
        if (data) {
          setEducationStatuses(
            data.map((d) => ({ id: d.id, label: d.label_zh }))
          );
        }
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    setPublicUrl(
      `${origin}/teachers?teacher_code=${encodeURIComponent(
        profile.teacherCode
      )}`
    );
  }, [profile.teacherCode]);

  // Sync state with initialProfile prop when it changes (e.g. after parent refetch)
  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  // Handler helpers
  const handleChange = (field: keyof TeacherProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const { showModal } = useModal();

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(profile);
      showModal({ type: "success", title: "儲存成功", description: "個人檔案已成功更新", confirmText: "確定" });
    } catch (e) {
      console.error(e);
      showModal({ type: "error", title: "儲存失敗", description: (e as Error).message || "請稍後再試", confirmText: "確定" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddEducationSubmit = async () => {
    if (!newEdu.schoolName || !newEdu.startYear) {
      showModal({ type: "error", title: "資料不完整", description: "請填寫學校名稱與入學年份", confirmText: "確定" });
      return;
    }

    setAddingEduLoading(true);
    try {
      // 1. Resolve School ID (Get or Create)
      // Find school code from list if matched by name
      const matchedSchool = schools.find((s) => s.name === newEdu.schoolName);
      const p_code = matchedSchool ? matchedSchool.code : null;

      const { data: schoolId, error: rpcError } = await supabase.rpc(
        "get_or_create_school",
        {
          p_code: p_code || "", // Pass empty string if code is null/undefined to satisfy type
          p_name: newEdu.schoolName,
          p_city: undefined, // Optional
          p_website: undefined,
        }
      );

      if (rpcError || !schoolId) {
        throw new Error(rpcError?.message || "School resolution failed");
      }

      // 2. Add Education
      const added = await onAddEducation({
        schoolId: schoolId,
        schoolName: newEdu.schoolName, // Just for UI optimism if needed, though repo fetches it
        degree: newEdu.degree,
        degreeLevel: newEdu.degreeLevel,
        department: newEdu.department,
        startYear: parseInt(newEdu.startYear),
        endYear: newEdu.endYear ? parseInt(newEdu.endYear) : null,
        statusId: parseInt(newEdu.statusId),
        isVerified: false,
      });

      if (added) {
        setProfile((prev) => ({
          ...prev,
          educations: [added, ...prev.educations],
        }));
        setIsAddingEducation(false);
        setNewEdu({
          schoolName: "",
          degree: "",
          degreeLevel: "bachelor",
          department: "",
          startYear: "",
          endYear: "",
          statusId: "1",
        });
      }
    } catch (err: any) {
      console.error(err);
      showModal({ type: "error", title: "新增學歷失敗", description: err.message, confirmText: "確定" });
    } finally {
      setAddingEduLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSpecialty.trim()) {
      e.preventDefault();
      if (!profile.specialties.includes(newSpecialty.trim())) {
        handleChange("specialties", [
          ...profile.specialties,
          newSpecialty.trim(),
        ]);
      }
      setNewSpecialty("");
    }
  };

  const removeTag = (tag: string) => {
    handleChange(
      "specialties",
      profile.specialties.filter((t) => t !== tag)
    );
  };

  const handleCopyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      showModal({ type: "success", title: "複製成功", description: "公開個人頁網址已複製到剪貼簿", confirmText: "確定" });
    } catch (error) {
      console.error(error);
      showModal({ type: "error", title: "複製失敗", description: "請手動複製網址", confirmText: "確定" });
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
      const publicAvatarUrl = await updateUserAvatar({
        userId: profile.id,
        file,
      });
      setProfile((prev) => ({ ...prev, avatarUrl: publicAvatarUrl }));
      await onSave({ avatarUrl: publicAvatarUrl });
      showModal({ type: "success", title: "頭像更新成功", description: "您的大頭貼已成功更新", confirmText: "確定" });
    } catch (error: any) {
      console.error(error);
      showModal({ type: "error", title: "頭像上傳失敗", description: error.message || "請稍後再試", confirmText: "確定" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePhilosophyChange = (
    index: number,
    field: "title" | "description" | "icon",
    value: string
  ) => {
    const items = profile.philosophyItems || [];
    const updated = items.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    handleChange("philosophyItems", updated);
  };

  const handleAddPhilosophyItem = () => {
    const items = profile.philosophyItems || [];
    handleChange("philosophyItems", [
      ...items,
      {
        title: "新教學理念",
        description: "",
        icon: "lightbulb",
      },
    ]);
  };

  const handleRemovePhilosophyItem = (index: number) => {
    const items = profile.philosophyItems || [];
    handleChange(
      "philosophyItems",
      items.filter((_, idx) => idx !== index)
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          個人檔案設定
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-lg shadow-primary/30 transition-all disabled:opacity-50"
        >
          {saving ? "儲存中..." : "儲存變更"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Public Status */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark flex flex-col items-center text-center">
            <div className="relative size-32 rounded-full overflow-hidden mb-4 border-4 border-slate-100 dark:border-slate-700">
              <Image
                src={
                  profile.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${profile.name}&background=random`
                }
                alt={profile.name}
                fill
                className="object-cover"
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="text-sm text-primary font-bold hover:underline mb-2 disabled:opacity-50"
            >
              {uploadingAvatar ? "上傳中..." : "更換大頭貼"}
            </button>
            <p className="text-xs text-text-sub">
              建議尺寸: 500x500px, JPG/PNG
            </p>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
              公開個人頁網址
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={publicUrl}
                readOnly
                className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-gray-300 outline-none"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors"
              >
                複製
              </button>
            </div>
            <p className="text-xs text-text-sub mt-3">
              分享給學生時使用，需先開啟公開個人檔案。
            </p>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
              顯示狀態
            </h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                公開個人檔案
              </span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={profile.isPublic}
                  onChange={(e) => handleChange("isPublic", e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>
            <p className="text-xs text-text-sub mt-3">
              開啟後，學生將能在「找老師」頁面搜尋到您的檔案。
            </p>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">
              系統整合
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  Google Calendar 同步
                </span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={profile.googleCalendarEnabled}
                    onChange={(e) =>
                      handleChange("googleCalendarEnabled", e.target.checked)
                    }
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  LINE 通知
                </span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={profile.lineNotifyEnabled}
                    onChange={(e) =>
                      handleChange("lineNotifyEnabled", e.target.checked)
                    }
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>
            </div>
            <p className="text-xs text-text-sub mt-3">
              啟用後可接收即時預約通知。
            </p>
          </div>
        </div>

        {/* Right Column: Key Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 border-b border-border-light dark:border-border-dark pb-3">
              基本資訊
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  顯示名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  職稱 / 頭銜
                </label>
                <input
                  type="text"
                  value={profile.title || ""}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="例如：資深美語教師"
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  Email (無法更改)
                </label>
                <input
                  type="text"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-100 dark:bg-slate-900 text-text-sub cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  聯絡電話
                </label>
                <input
                  type="text"
                  value={profile.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 border-b border-border-light dark:border-border-dark pb-3">
              專業介紹
            </h3>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  個人簡介 (Bio)
                </label>
                <textarea
                  rows={5}
                  value={profile.bio || ""}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  placeholder="請介紹您的教學理念、經歷以及風格..."
                  className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                  教學專長 / 標籤
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.specialties.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-primary-dark"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="輸入後按 Enter 新增..."
                    className="inline-flex min-w-[120px] px-3 py-1 rounded-full text-xs bg-transparent border border-dashed border-slate-300 dark:border-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <p className="text-xs text-text-sub">
                  例如：多益金色證書、幼兒美語、商用英文 (建議 3-5 個)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                    教學年資 (年)
                  </label>
                  <input
                    type="number"
                    value={profile.experienceYears ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "experienceYears",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                    基礎時薪 (參考用)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-text-sub">
                      $
                    </span>
                    <input
                      type="number"
                      value={profile.basePrice ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "basePrice",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      className="w-full pl-8 pr-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <div className="flex items-center justify-between mb-6 border-b border-border-light dark:border-border-dark pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white">
                教學理念卡片
              </h3>
              <button
                type="button"
                onClick={handleAddPhilosophyItem}
                className="text-xs font-bold text-primary hover:text-primary-dark"
              >
                新增卡片
              </button>
            </div>
            <div className="space-y-1.5 mb-4">
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                教學理念副標題
              </label>
              <textarea
                rows={2}
                value={profile.philosophySubtitle || ""}
                onChange={(e) =>
                  handleChange("philosophySubtitle", e.target.value)
                }
                placeholder="簡述您的教學理念..."
                className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <p className="text-xs text-text-sub">
                此內容將顯示在公開個人頁「我的教學理念」標題下方
              </p>
            </div>
            <div className="space-y-4">
              {(profile.philosophyItems || []).length === 0 && (
                <p className="text-sm text-text-sub">尚未設定教學理念卡片。</p>
              )}
              {(profile.philosophyItems || []).map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-text-sub">
                      卡片 {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhilosophyItem(index)}
                      className="text-xs font-bold text-red-500 hover:text-red-600"
                    >
                      刪除
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
                        Icon 名稱
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={item.icon}
                          onChange={(e) =>
                            handlePhilosophyChange(
                              index,
                              "icon",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        >
                          {iconOptions.map((icon) => (
                            <option key={icon} value={icon}>
                              {icon}
                            </option>
                          ))}
                        </select>
                        <div className="size-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[22px]">
                            {item.icon || "help"}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-text-sub">
                        使用 Google Material Symbols 名稱
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
                        標題
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) =>
                          handlePhilosophyChange(index, "title", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-3">
                      <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
                        內容
                      </label>
                      <textarea
                        rows={3}
                        value={item.description}
                        onChange={(e) =>
                          handlePhilosophyChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-border-light dark:border-border-dark">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 border-b border-border-light dark:border-border-dark pb-3 flex justify-between items-center">
              <span>學歷背景</span>
              {!isAddingEducation && (
                <button
                  onClick={() => setIsAddingEducation(true)}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  + 新增學歷
                </button>
              )}
            </h3>

            {isAddingEducation && (
              <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
                    學校名稱 <span className="text-red-500">*</span>
                  </label>
                  <SchoolCombobox
                    schools={schools}
                    value={newEdu.schoolName}
                    onChange={(val) =>
                      setNewEdu((prev) => ({ ...prev, schoolName: val }))
                    }
                    placeholder="搜尋或輸入學校名稱..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
                      學歷階段 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newEdu.degreeLevel}
                      onChange={(e) =>
                        setNewEdu((prev) => ({
                          ...prev,
                          degreeLevel: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                      {DEGREE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
                      學位/系所名稱
                    </label>
                    <input
                      type="text"
                      value={newEdu.department}
                      onChange={(e) =>
                        setNewEdu((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                      placeholder="例如：資訊工程學系"
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
                      入學年份 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newEdu.startYear}
                      onChange={(e) =>
                        setNewEdu((prev) => ({
                          ...prev,
                          startYear: e.target.value,
                        }))
                      }
                      placeholder="YYYY"
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
                      畢業年份 (選填)
                    </label>
                    <input
                      type="number"
                      value={newEdu.endYear}
                      onChange={(e) =>
                        setNewEdu((prev) => ({
                          ...prev,
                          endYear: e.target.value,
                        }))
                      }
                      placeholder="YYYY"
                      className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-gray-300">
                    就學狀態 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newEdu.statusId}
                    onChange={(e) =>
                      setNewEdu((prev) => ({
                        ...prev,
                        statusId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  >
                    {educationStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAddingEducation(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddEducationSubmit}
                    disabled={addingEduLoading}
                    className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                  >
                    {addingEduLoading ? "處理中..." : "確認新增"}
                  </button>
                </div>
              </div>
            )}

            {profile.educations.length === 0 ? (
              <p className="text-text-sub text-sm">尚無學歷資料。</p>
            ) : (
              <div className="space-y-4">
                {profile.educations.map((edu) => {
                  const levelLabel =
                    DEGREE_LEVELS.find((l) => l.value === edu.degreeLevel)
                      ?.label ||
                    edu.degreeLevel ||
                    "";
                  return (
                    <div
                      key={edu.id}
                      className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">
                          {edu.schoolName}
                        </h4>
                        <p className="text-sm text-text-sub">
                          {[
                            levelLabel ? levelLabel.split(" ")[0] : null, // Show only Chinese part
                            edu.department,
                            edu.degree,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          {edu.statusLabel && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300">
                              {edu.statusLabel}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-sub mt-1">
                          {edu.startYear} - {edu.endYear || "迄今"}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteEducation(edu.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Experience Section */}
            <ExperienceSection
              teacherId={profile.id}
              experiences={profile.experiences || []}
              onUpdate={onRefresh}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
