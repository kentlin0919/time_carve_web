"use client";

import React, { useState, useEffect } from "react";
import { Course, CourseSection } from "@/lib/domain/course/entity";
import { useModal } from "@/components/providers/ModalContext";
import { supabase } from "@/lib/supabase"; // Import supabase
import Select from "@/components/ui/Select"; // Import Select

interface CourseDetailFormProps {
  initialData: Partial<Course>;
  onSave: (data: Partial<Course>) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
  isCreating?: boolean;
}

export default function CourseDetailForm({
  initialData,
  onSave,
  onCancel,
  saving = false,
  isCreating = false,
}: CourseDetailFormProps) {
  const [form, setForm] = useState<Partial<Course>>({
    title: "",
    price: 0,
    priceUnit: "小時",
    desc: "",
    content: "",
    sections: [],
    status: "draft",
    tags: [],
    imageUrl: null,
    ...initialData,
  });

  const { showModal } = useModal();
  const [currentTagInput, setCurrentTagInput] = useState("");
  const [courseTypes, setCourseTypes] = useState<
    { name: string; label_zh: string | null }[]
  >([]);
  const [globalTags, setGlobalTags] = useState<{ id: string; name: string }[]>(
    []
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // If initialData changes significantly (e.g. switching courses), reset form
    // But typically this component is mounted afresh or key changes
    setForm((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  useEffect(() => {
    if (form.imageUrl) {
      setImagePreviewUrl(form.imageUrl);
    }
  }, [form.imageUrl]);

  // Fetch course types

  useEffect(() => {
    const fetchTypes = async () => {
      const { data, error } = await supabase

        .from("class_type")

        .select("name, label_zh")

        .eq("is_active", true)

        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching class_type for form:", error);
      }

      if (data) {
        setCourseTypes(data);

        if (!initialData.courseType && data.length > 0) {
          setForm((prev) => ({ ...prev, courseType: data[0].name }));
        }
      }
    };

    fetchTypes();
  }, [initialData.courseType]); // Depend on initialData.courseType to re-evaluate if needed

  // Fetch global tags
  useEffect(() => {
    const fetchGlobalTags = async () => {
      const { data } = await supabase
        .from("tags")
        .select("id, name")
        .is("teacher_id", null) // Select only global tags
        .order("name", { ascending: true });

      if (data) {
        setGlobalTags(data);
      }
    };
    fetchGlobalTags();
  }, []);

  const handleChange = (field: keyof Course, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (status: "draft" | "active") => {
    setForm((prev) => ({
      ...prev,
      status,
      isActive: status === "active",
    }));
  };

  const handleAddTag = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>
      | null,
    tagTextToAdd?: string
  ) => {
    // If it's a keyboard event, only proceed if Key is Enter
    if (e && "key" in e && e.key !== "Enter") {
      return;
    }

    // Prevent default form submission
    if (e) {
      e.preventDefault();
    }

    // Determine the text to add: either passed directly or from input state
    const textToUse = tagTextToAdd ? tagTextToAdd : currentTagInput.trim();

    if (textToUse) {
      const newTag = { icon: "label", text: textToUse };

      // Prevent adding duplicates
      const isDuplicate = form.tags?.some((t) => t.text === newTag.text);

      if (!isDuplicate) {
        setForm((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), newTag],
        }));
      }
      // Only clear input if we used the input value
      if (!tagTextToAdd) {
        setCurrentTagInput("");
      }
    }
  };

  const handleRemoveTag = (text: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t.text !== text),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      showModal({
        title: "錯誤",
        description: "請輸入課程名稱",
        confirmText: "確定",
      });
      return;
    }
    onSave(form);
  };

  const handleCourseImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showModal({
        title: "格式不支援",
        description: "請上傳圖片檔案 (JPG/PNG/WebP)。",
        confirmText: "確定",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showModal({
        title: "檔案過大",
        description: "圖片大小請勿超過 10MB。",
        confirmText: "確定",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `${form.id || "draft"}-${Date.now()}.${fileExt}`;
      const filePath = `course-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("course-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("course-images").getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("取得圖片連結失敗");
      }

      setForm((prev) => ({ ...prev, imageUrl: publicUrl }));
      setImagePreviewUrl(publicUrl);
    } catch (err: any) {
      console.error("Error uploading course image:", err);
      showModal({
        title: "上傳失敗",
        description: err?.message || "圖片上傳失敗，請稍後再試。",
        confirmText: "確定",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveCourseImage = () => {
    setForm((prev) => ({ ...prev, imageUrl: null }));
    setImagePreviewUrl(null);
  };

  // Sections Logic
  const handleAddSection = () => {
    const newSection: CourseSection = {
      id: crypto.randomUUID(),
      title: "",
      content: "",
    };
    setForm((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));
  };

  const handleUpdateSection = (
    id: string,
    field: keyof CourseSection,
    val: any
  ) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections?.map((s) =>
        s.id === id ? { ...s, [field]: val } : s
      ),
    }));
  };

  const handleDeleteSection = (id: string) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections?.filter((s) => s.id !== id),
    }));
  };

  // Expected Outcomes Logic
  const handleAddOutcome = () => {
    setForm((prev) => ({
      ...prev,
      expectedLearningOutcomes: [...(prev.expectedLearningOutcomes || []), ""],
    }));
  };

  const handleUpdateOutcome = (index: number, value: string) => {
    setForm((prev) => {
      const newOutcomes = [...(prev.expectedLearningOutcomes || [])];
      newOutcomes[index] = value;
      return { ...prev, expectedLearningOutcomes: newOutcomes };
    });
  };

  const handleDeleteOutcome = (index: number) => {
    setForm((prev) => {
      const newOutcomes =
        prev.expectedLearningOutcomes?.filter((_, i) => i !== index) || [];
      return { ...prev, expectedLearningOutcomes: newOutcomes };
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* Header */}
      <header className="w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-8 py-4 flex justify-between items-center sticky top-0 z-10 transition-all">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onCancel}
              className="text-text-sub hover:text-primary transition-colors text-sm flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              返回課程列表
            </button>
          </div>
          <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight flex items-center gap-2">
            {isCreating ? "新增課程方案" : "編輯課程方案"}
            <span className="text-text-sub font-normal text-base ml-2">
              {isCreating ? "創建全新的教學計畫" : "修改您的課程內容與設定"}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification / Profile area placeholdes from design */}
          <button className="p-2.5 rounded-full text-text-sub dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-700 relative transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-surface-dark"></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-5xl mx-auto pb-10">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {isCreating ? "建立課程" : "課程內容"}
                </h3>
                <p className="text-text-sub dark:text-gray-400 text-sm mt-1">
                  請填寫完整的課程資訊，建立後可預覽或直接發布。
                </p>
              </div>
            </div>

            {/* 1. Basic Info */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  article
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  基本資訊
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                    課程名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="例如：進階門齒型態雕刻實作"
                    className="block w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none sm:text-sm py-2.5 px-3 font-bold text-lg placeholder-slate-400"
                  />
                </div>
                <div className="col-span-1">
                  <Select
                    label="課程類型"
                    value={form.courseType || ""}
                    onChange={(e) => handleChange("courseType", e.target.value)}
                    options={courseTypes.map((t) => ({
                      value: t.name,
                      label: t.label_zh || t.name,
                    }))}
                    className="font-bold text-lg"
                    required
                  >
                    {courseTypes.length === 0 && (
                      // Fallback if DB is empty or fetch failed
                      <>
                        <option value="1-on-1">一對一教學</option>
                        <option value="group">團體課程</option>
                      </>
                    )}
                  </Select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                    單價格設定 (TWD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden">
                    <span className="pl-4 text-text-sub text-sm font-medium">
                      NT$
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.price || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        handleChange("price", val ? Number(val) : 0);
                      }}
                      placeholder="0"
                      className="flex-1 py-2.5 px-2 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-bold text-lg sm:text-sm"
                    />
                    <div className="pr-4 border-l border-border-light dark:border-border-dark py-2.5 pl-4">
                      <span className="text-slate-700 dark:text-gray-300 text-sm font-medium">
                        每小時
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-text-sub mt-1.5">
                    將依據此價格計算學生預約時的總費用。
                  </p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                    課程簡介
                  </label>
                  <textarea
                    rows={3}
                    value={form.desc}
                    onChange={(e) => handleChange("desc", e.target.value)}
                    placeholder="請簡述課程特色、適合對象以及學習成效..."
                    className="block w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none sm:text-sm py-2.5 px-3"
                  />
                </div>
              </div>
            </div>

            {/* 1.2 Expected Learning Outcomes */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    check_circle
                  </span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    預期學習成果
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddOutcome}
                  className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  新增成果
                </button>
              </div>
              <div className="p-6">
                {(form.expectedLearningOutcomes || []).length === 0 && (
                  <div className="text-center text-text-sub text-sm py-4">
                    尚未設定學習成果，建議至少新增 3-5 項。
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(form.expectedLearningOutcomes || []).map(
                    (outcome, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 group"
                      >
                        <span className="material-symbols-outlined text-primary text-[20px]">
                          check_circle
                        </span>
                        <input
                          type="text"
                          value={outcome}
                          onChange={(e) =>
                            handleUpdateOutcome(index, e.target.value)
                          }
                          placeholder="例如：熟練操作咬合器..."
                          className="flex-1 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none sm:text-sm py-2 px-3"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteOutcome(index)}
                          className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="刪除"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            remove_circle
                          </span>
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* 1.5 Tags */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  label
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  課程標籤
                </h3>
              </div>
              <div className="p-6">
                {/* Global Tags Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                    選擇現有標籤
                  </label>
                  {globalTags.length === 0 && (
                    <p className="text-sm text-text-sub italic">
                      目前沒有全域標籤可供選擇。
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {globalTags.map((tag) => (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() => handleAddTag(null, tag.name)} // Pass tag name directly
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                          ${
                            form.tags?.some((t) => t.text === tag.name)
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-primary/20 hover:text-primary dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-primary/50"
                          } transition-colors`}
                        disabled={form.tags?.some((t) => t.text === tag.name)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Tag Input */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                    新增自訂標籤 (按 Enter 或點擊按鈕新增)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentTagInput}
                      onChange={(e) => setCurrentTagInput(e.target.value)}
                      onKeyDown={(e) => handleAddTag(e)} // Existing handler for keyboard
                      placeholder="例如：牙醫國考, 備審資料"
                      className="block flex-1 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none sm:text-sm py-2.5 px-3"
                    />
                    <button
                      type="button"
                      onClick={(e) => handleAddTag(e)} // Existing handler for button click
                      disabled={!currentTagInput.trim()}
                      className="flex items-center justify-center p-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        add
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tags?.map((tag) => (
                    <span
                      key={tag.text}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                    >
                      {tag.text}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.text)}
                        className="hover:text-primary-dark ml-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          close
                        </span>
                      </button>
                    </span>
                  ))}
                  {(!form.tags || form.tags.length === 0) && (
                    <span className="text-sm text-text-sub italic">
                      尚未新增標籤
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Course Stages (Sections) */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-blue-50/50 dark:bg-blue-900/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    segment
                  </span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    課程階段安排
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  新增階段
                </button>
              </div>
              <div className="p-6 space-y-6">
                {(form.sections || []).length === 0 && (
                  <div className="text-center text-text-sub text-sm py-4">
                    暫無階段，請新增。
                  </div>
                )}
                {form.sections?.map((section, idx) => (
                  <div
                    key={section.id}
                    className="relative group rounded-xl border border-border-light dark:border-border-dark p-4 bg-slate-50 dark:bg-slate-800/30 hover:border-primary/50 transition-colors"
                  >
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-slate-400 hover:text-red-500"
                        title="刪除"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          delete
                        </span>
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) =>
                            handleUpdateSection(
                              section.id,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="階段名稱 (例如：第一週 - 基礎理論)"
                          className="block w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none sm:text-sm py-2.5 px-3 font-bold placeholder-slate-400"
                        />
                      </div>
                    </div>

                    {/* 學習目標 */}
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-text-sub mb-1 block flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          flag
                        </span>
                        學習目標
                      </label>
                      <input
                        type="text"
                        value={section.learningObjective || ""}
                        onChange={(e) =>
                          handleUpdateSection(
                            section.id,
                            "learningObjective",
                            e.target.value
                          )
                        }
                        placeholder="例如：熟悉半調節式咬合器構造，並正確裝載上下顎模型。"
                        className="block w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none sm:text-sm py-2.5 px-3"
                      />
                    </div>

                    {/* 單元重點 */}
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-text-sub mb-1 block flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          checklist
                        </span>
                        單元重點
                      </label>
                      <div className="space-y-2">
                        {(section.keyPoints || []).map((point, pointIdx) => (
                          <div
                            key={pointIdx}
                            className="flex items-center gap-2"
                          >
                            <span className="text-primary text-sm">•</span>
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => {
                                const newKeyPoints = [
                                  ...(section.keyPoints || []),
                                ];
                                newKeyPoints[pointIdx] = e.target.value;
                                handleUpdateSection(
                                  section.id,
                                  "keyPoints",
                                  newKeyPoints
                                );
                              }}
                              placeholder="輸入重點項目..."
                              className="flex-1 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none sm:text-sm py-2 px-3"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newKeyPoints = (
                                  section.keyPoints || []
                                ).filter((_, i) => i !== pointIdx);
                                handleUpdateSection(
                                  section.id,
                                  "keyPoints",
                                  newKeyPoints
                                );
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                              title="刪除此重點"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                remove_circle
                              </span>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newKeyPoints = [
                              ...(section.keyPoints || []),
                              "",
                            ];
                            handleUpdateSection(
                              section.id,
                              "keyPoints",
                              newKeyPoints
                            );
                          }}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark transition-colors mt-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            add
                          </span>
                          新增重點項目
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1">
                      <div>
                        <label className="text-xs font-semibold text-text-sub mb-1 block">
                          階段內容
                        </label>
                        <input
                          type="text"
                          value={section.content || ""}
                          onChange={(e) =>
                            handleUpdateSection(
                              section.id,
                              "content",
                              e.target.value
                            )
                          }
                          placeholder="例如：包含講義導讀與工具介紹"
                          className="block w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none sm:text-sm py-2.5 px-3"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSection}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-border-light dark:border-border-dark text-text-sub hover:border-primary hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2 group"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                    add_circle
                  </span>
                  <span className="font-medium text-sm">新增下一個階段</span>
                </button>
              </div>
            </div>

            {/* 3. Full Lesson Plan (Rich Text) */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  edit_note
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  完整教案內容
                </h3>
              </div>
              <div className="flex flex-col h-[500px]">
                {/* Simulated Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark overflow-x-auto">
                  {/* Icons would go here, simplified for now since we use a textarea below for MVP, 
                        or we could use contentEditable div but state managing is tricky without a library.
                        To stick to the design's look but function reliably, I'll use a styled textarea for now
                        or a simple contenteditable div that updates state onBlur.
                        Let's use a Textarea that LOOKS like the design for stability without Tiptap/Draft.js per instructions to keep stack simple unless requested.
                    */}
                  <div className="px-2 text-xs text-text-sub">
                    支援 Markdown 語法
                  </div>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 p-0 overflow-y-auto">
                  <textarea
                    value={form.content || ""}
                    onChange={(e) => handleChange("content", e.target.value)}
                    placeholder="在此輸入詳細教案內容..."
                    className="w-full h-full p-6 resize-none border-none outline-none bg-transparent prose prose-slate dark:prose-invert max-w-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* 4. Media & Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Media Upload */}
              <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    perm_media
                  </span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    課程圖片與教材
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCourseImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                          <span className="material-symbols-outlined text-4xl text-text-sub group-hover:text-primary mb-3 transition-colors">
                            cloud_upload
                          </span>
                          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-primary">
                              點擊上傳
                            </span>{" "}
                            或將檔案拖曳至此
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            支援 JPG / PNG / WebP (Max 10MB)
                          </p>
                          {uploadingImage && (
                            <p className="text-xs text-primary mt-2">
                              上傳中...
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                    <div className="w-full lg:w-64">
                      <div className="w-full aspect-video rounded-xl border border-border-light dark:border-border-dark bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                        {imagePreviewUrl ? (
                          <img
                            src={imagePreviewUrl}
                            alt="課程圖片預覽"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-xs text-text-sub text-center px-4">
                            尚未上傳圖片
                          </div>
                        )}
                      </div>
                      {imagePreviewUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveCourseImage}
                          className="mt-3 w-full px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          移除圖片
                        </button>
                      )}
                      {form.imageUrl && (
                        <p className="text-[11px] text-text-sub mt-2 break-all">
                          {form.imageUrl}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="lg:col-span-1 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden h-fit">
                <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    published_with_changes
                  </span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    發布狀態設定
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-4">
                    <label className="flex items-center p-3 border border-border-light dark:border-border-dark rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        checked={form.status === "draft"}
                        onChange={() => handleStatusChange("draft")}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-slate-900 dark:text-white">
                          草稿 (Draft)
                        </span>
                        <span className="block text-xs text-text-sub">
                          僅自己可見，不會顯示在前台
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-border-light dark:border-border-dark rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={form.status === "active"}
                        onChange={() => handleStatusChange("active")}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-slate-900 dark:text-white">
                          啟用 (Active)
                        </span>
                        <span className="block text-xs text-text-sub">
                          立即發布，學生可進行預約
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between z-10">
              <div className="text-sm text-text-sub hidden sm:block">
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">
                    info
                  </span>{" "}
                  請確保所有必填欄位皆已填寫
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 rounded-lg border border-border-light dark:border-border-dark text-slate-600 dark:text-gray-300 bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/20 transition-all active:scale-95 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    "儲存中..."
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">
                        {isCreating ? "add_task" : "save"}
                      </span>
                      {isCreating ? "建立課程" : "儲存課程"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
