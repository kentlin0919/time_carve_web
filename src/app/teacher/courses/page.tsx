"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useModal } from "@/components/providers/ModalContext";

import { createClient } from "@/lib/supabase/client";
import { Course, CourseSection } from "@/lib/domain/course/entity";
import { SupabaseCourseRepository } from "@/lib/infrastructure/course/SupabaseCourseRepository";
import { SupabaseAuthRepository } from "@/lib/infrastructure/auth/SupabaseAuthRepository";
import CourseDetailForm from "./CourseDetailForm";

export default function TeacherCoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { showModal } = useModal();

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<Partial<Course>>({});
  const [activeTab, setActiveTab] = useState<"info" | "content">("info"); // Tab state
  const [showAllFields, setShowAllFields] = useState(false);
  const [expandedContent, setExpandedContent] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  // Load courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const authRepo = new SupabaseAuthRepository();
        const courseRepo = new SupabaseCourseRepository(supabase);
        const user = await authRepo.getUser();

        if (user) {
          const data = await courseRepo.getTeacherCourses(user.id);
          setCourses(data);
          if (data.length > 0) {
            setSelectedCourseId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Check for 'new=true' query param
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setEditForm({
        title: "",
        price: 0,
        priceUnit: "小時",
        desc: "",
        status: "draft",
        sections: [],
      });
      setIsCreating(true);
      setIsEditing(false);

      // Optional: Clean up the URL
      router.replace("/teacher/courses");
    }
  }, [searchParams, router]);

  // When selected course changes, reset edit mode
  useEffect(() => {
    setIsEditing(false);
    setActiveTab("info");
    setExpandedContent(false);
    setExpandedSections({});
  }, [selectedCourseId]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const handleEditClick = () => {
    if (!selectedCourse) return;
    setEditForm(JSON.parse(JSON.stringify(selectedCourse)));
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditForm({});
  };

  const handleSaveCourse = async (formData: Partial<Course>) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const courseRepo = new SupabaseCourseRepository(supabase);

      if (isCreating) {
        const authRepo = new SupabaseAuthRepository();
        const user = await authRepo.getUser();
        if (!user) return;

        const newCourseData = {
          teacherId: user.id,
          title: formData.title || "未命名課程",
          desc: formData.desc || "",
          content: formData.content || "",
          courseType: formData.courseType || "1-on-1",
          durationMinutes: formData.durationMinutes || 60,
          price: formData.price || 0,
          imageUrl: formData.imageUrl || null,
          isActive: formData.isActive || false, // Default from form shouldn't override unless set
          status: formData.status || "draft",
          sections: formData.sections || [],
          tags: formData.tags || [],
          icon: formData.icon || "school",
          iconColor: formData.iconColor || "blue",
          priceUnit: formData.priceUnit || "小時",
        };

        const createdCourse = await courseRepo.createCourse(newCourseData);
        if (createdCourse) {
          setCourses((prev) => [createdCourse, ...prev]);
          setSelectedCourseId(createdCourse.id);
          showModal({
            title: "成功",
            description: "課程建立成功",
            confirmText: "確定",
          });
          setIsCreating(false);
        }
      } else {
        // Validation: Ensure ID exists
        if (!formData.id && selectedCourse?.id) {
          // Fallback to selected ID if form doesn't have it (it should based on editForm init)
          // But actually formData is partial from form state, might lack ID if not passed
          // Let's us selectedCourse.id
        }

        const targetId = formData.id || selectedCourse?.id;
        if (!targetId) return;

        const updatedCourse = await courseRepo.updateCourse(targetId, formData);

        if (updatedCourse) {
          setCourses((prev) =>
            prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
          );
          showModal({
            title: "成功",
            description: "儲存成功",
            confirmText: "確定",
          });
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Error saving course:", error);
      showModal({
        title: "錯誤",
        description: "儲存失敗，請稍後再試",
        confirmText: "確定",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCourse = () => {
    setEditForm({
      title: "",
      price: 0,
      priceUnit: "小時",
      desc: "",
      status: "draft",
      sections: [],
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.desc || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDateTime = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const renderField = (
    label: string,
    value: React.ReactNode,
    shouldShow: boolean
  ) => {
    if (!showAllFields && !shouldShow) return null;
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-sub">{label}</span>
        <span className="text-sm text-slate-800 dark:text-white break-all">
          {shouldShow ? value : "—"}
        </span>
      </div>
    );
  };

  if (isEditing || isCreating) {
    return (
      <CourseDetailForm
        initialData={editForm}
        isCreating={isCreating}
        onSave={handleSaveCourse}
        onCancel={handleCancel}
        saving={saving}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10 transition-all">
        <div className="flex flex-col">
          <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight flex items-center gap-2">
            課程方案管理
          </h2>
          <p className="text-text-sub dark:text-gray-400 text-sm mt-0.5">
            共 <span className="text-primary font-bold">{courses.length}</span>{" "}
            個課程方案
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              className="pl-10 pr-4 py-2 w-64 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
              placeholder="搜尋課程名稱..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub group-focus-within:text-primary text-[18px] transition-colors">
              search
            </span>
          </div>

          <button
            onClick={handleCreateCourse}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            新增教案
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
          {/* Two-Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
            {/* Left ListView */}
            <div className="lg:w-1/3 flex flex-col bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden">
              <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white border border-border-light dark:border-border-dark">
                    全部
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white dark:hover:bg-slate-700 text-text-sub transition-colors">
                    啟用中
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-border-light dark:divide-border-dark">
                  {filteredCourses.map((course) => {
                    const isSelected = selectedCourseId === course.id;
                    const isActive = course.status === "active";
                    const updatedAt = formatDateTime(course.updatedAt);
                    const thumbnailUrl = course.imageUrl?.trim();

                    return (
                      <div
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-l-4 ${isSelected
                          ? "border-primary bg-blue-50/50 dark:bg-blue-900/10"
                          : "border-transparent"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {thumbnailUrl ? (
                            <div className="relative size-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm">
                              <Image
                                src={thumbnailUrl}
                                alt={`${course.title} 封面`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={`size-12 rounded-lg bg-${course.iconColor || "blue"
                                }-100 dark:bg-${course.iconColor || "blue"
                                }-900/30 text-${course.iconColor || "blue"
                                }-600 dark:text-${course.iconColor || "blue"
                                }-400 flex items-center justify-center flex-shrink-0 shadow-sm`}
                            >
                              <span className="material-symbols-outlined">
                                {course.icon || "school"}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate pr-2">
                                {course.title}
                              </h4>
                              {isActive ? (
                                <span
                                  className="material-symbols-outlined text-[14px] text-green-500"
                                  title="啟用中"
                                >
                                  check_circle
                                </span>
                              ) : (
                                <span
                                  className="material-symbols-outlined text-[14px] text-slate-400"
                                  title="草稿"
                                >
                                  edit_document
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-sub mt-0.5 space-y-1">
                              <p className="truncate">
                                {course.courseType || "未設定類型"} •{" "}
                                {course.priceUnit || "小時"} • $
                                {course.price?.toLocaleString() || 0}
                              </p>
                              <p className="truncate">
                                時長{" "}
                                {Math.ceil((course.durationMinutes || 0) / 60)}{" "}
                                小時
                                {updatedAt ? ` • 更新 ${updatedAt}` : ""}
                              </p>
                            </div>
                            {(course.tags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {course.tags?.slice(0, 3).map((tag, idx) => (
                                  <span
                                    key={`${course.id}-tag-${idx}`}
                                    className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  >
                                    {tag.text}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel - View or Edit */}
            <div className="lg:w-2/3 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card flex flex-col overflow-hidden">
              {selectedCourse ? (
                // ========== VIEW MODE ==========
                <>
                  <div className="p-4 md:p-8 border-b border-border-light dark:border-border-dark bg-slate-50/30 dark:bg-slate-800/30">
                    <div className="flex items-start gap-5">
                      <div
                        className={`size-20 rounded-2xl bg-${selectedCourse.iconColor}-100 dark:bg-${selectedCourse.iconColor}-900/30 text-${selectedCourse.iconColor}-600 dark:text-${selectedCourse.iconColor}-400 flex items-center justify-center flex-shrink-0 shadow-sm`}
                      >
                        <span className="material-symbols-outlined text-4xl">
                          {selectedCourse.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                              {selectedCourse.title}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                              {selectedCourse.status === "active" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  啟用中
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-gray-300 border border-slate-300 dark:border-slate-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                  草稿
                                </span>
                              )}
                              <span className="text-text-sub text-sm border-l border-border-light dark:border-border-dark pl-2 ml-1">
                                ID: {selectedCourse.id}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={handleEditClick}
                            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit_square
                            </span>
                            編輯
                          </button>
                        </div>
                        <p className="text-text-sub mt-4 text-sm leading-relaxed max-w-2xl">
                          {selectedCourse.desc}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                          <button
                            onClick={() => setShowAllFields((prev) => !prev)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-full border border-border-light dark:border-border-dark text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {showAllFields ? "僅顯示有值欄位" : "顯示全部欄位"}
                          </button>
                          {selectedCourse.content && (
                            <button
                              onClick={() =>
                                setExpandedContent((prev) => !prev)
                              }
                              className="px-3 py-1.5 text-xs font-semibold rounded-full border border-border-light dark:border-border-dark text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              {expandedContent ? "收合內容" : "展開內容"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-light dark:bg-surface-dark">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="font-bold text-slate-800 dark:text-white border-b pb-2">
                          基本資料
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderField(
                            "課程 ID",
                            selectedCourse.id,
                            Boolean(selectedCourse.id)
                          )}
                          {renderField(
                            "課程名稱",
                            selectedCourse.title,
                            Boolean(selectedCourse.title)
                          )}
                          {renderField(
                            "課程類型",
                            selectedCourse.courseType || "未設定",
                            Boolean(selectedCourse.courseType)
                          )}
                          {renderField(
                            "狀態",
                            selectedCourse.status || "draft",
                            Boolean(selectedCourse.status)
                          )}
                          {renderField(
                            "是否啟用",
                            selectedCourse.isActive ? "啟用" : "停用",
                            true
                          )}
                          {renderField(
                            "上課地點",
                            selectedCourse.location || "未設定",
                            Boolean(selectedCourse.location)
                          )}
                          {renderField(
                            "Icon",
                            selectedCourse.icon || "school",
                            Boolean(selectedCourse.icon)
                          )}
                          {renderField(
                            "Icon Color",
                            selectedCourse.iconColor || "blue",
                            Boolean(selectedCourse.iconColor)
                          )}
                        </div>

                        <h3 className="font-bold text-slate-800 dark:text-white border-b pb-2">
                          課程費用與時間
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderField(
                            "單價",
                            `NT$ ${(
                              selectedCourse.price || 0
                            ).toLocaleString()}`,
                            selectedCourse.price !== undefined &&
                            selectedCourse.price !== null
                          )}
                          {renderField(
                            "計價單位",
                            selectedCourse.priceUnit || "小時",
                            Boolean(selectedCourse.priceUnit)
                          )}
                          {renderField(
                            "課程時長",
                            `${selectedCourse.durationMinutes || 0} 分鐘`,
                            Boolean(selectedCourse.durationMinutes)
                          )}
                          {renderField(
                            "課程圖片",
                            selectedCourse.imageUrl || "未設定",
                            Boolean(selectedCourse.imageUrl)
                          )}
                          {renderField(
                            "總時數",
                            `${Math.ceil(
                              (selectedCourse.durationMinutes || 0) / 60
                            )} 小時`,
                            Boolean(selectedCourse.durationMinutes)
                          )}
                        </div>

                        <h3 className="font-bold text-slate-800 dark:text-white border-b pb-2">
                          課程內容
                        </h3>
                        <div className="space-y-3">
                          {renderField(
                            "簡介",
                            selectedCourse.desc || "—",
                            Boolean(selectedCourse.desc)
                          )}
                          {selectedCourse.content &&
                            (expandedContent || showAllFields) && (
                              <div className="rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                {selectedCourse.content}
                              </div>
                            )}
                          {showAllFields && !selectedCourse.content && (
                            <div className="text-xs text-text-sub">
                              尚未提供完整內容
                            </div>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-800 dark:text-white border-b pb-2">
                          標籤
                        </h3>
                        {(selectedCourse.tags || []).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(selectedCourse.tags || []).map((tag, idx) => (
                              <span
                                key={`${selectedCourse.id}-tag-${idx}`}
                                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 border border-border-light dark:border-border-dark"
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  {tag.icon}
                                </span>
                                {tag.text}
                              </span>
                            ))}
                          </div>
                        ) : (
                          showAllFields && (
                            <p className="text-sm text-text-sub">
                              尚未設定標籤
                            </p>
                          )
                        )}

                        <h3 className="font-bold text-slate-800 dark:text-white border-b pb-2">
                          系統時間
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderField(
                            "建立時間",
                            formatDateTime(selectedCourse.createdAt),
                            Boolean(selectedCourse.createdAt)
                          )}
                          {renderField(
                            "更新時間",
                            formatDateTime(selectedCourse.updatedAt),
                            Boolean(selectedCourse.updatedAt)
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="font-bold text-slate-800 dark:text-white border-b pb-2 flex items-center justify-between">
                          <span>
                            課程章節 ({selectedCourse.sections?.length || 0})
                          </span>
                        </h3>

                        <div className="space-y-3">
                          {!selectedCourse.sections ||
                            selectedCourse.sections.length === 0 ? (
                            <p className="text-text-sub text-sm">
                              尚未建立任何章節
                            </p>
                          ) : (
                            selectedCourse.sections.map((section, idx) => {
                              const isExpanded = expandedSections[section.id];
                              const hasAssets = Boolean(section.assets?.length);
                              return (
                                <div
                                  key={section.id}
                                  className="p-4 rounded-xl border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                                        {section.title ||
                                          `未命名章節 ${idx + 1}`}
                                      </h4>
                                      <p className="text-xs text-text-sub mt-1">
                                        {section.duration
                                          ? `${section.duration} 分鐘`
                                          : ""}
                                        {section.isFree ? " • 免費" : ""}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        setExpandedSections((prev) => ({
                                          ...prev,
                                          [section.id]: !prev[section.id],
                                        }))
                                      }
                                      className="text-xs font-semibold text-primary"
                                    >
                                      {isExpanded ? "收合" : "展開"}
                                    </button>
                                  </div>
                                  {(isExpanded || showAllFields) && (
                                    <div className="mt-3 text-xs text-text-sub space-y-2">
                                      {section.content && (
                                        <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                                          {section.content}
                                        </p>
                                      )}
                                      {hasAssets && (
                                        <div className="space-y-2">
                                          <p className="text-[11px] font-semibold uppercase">
                                            Assets
                                          </p>
                                          <div className="space-y-1.5">
                                            {section.assets?.map(
                                              (asset, assetIdx) => (
                                                <div
                                                  key={`${section.id}-asset-${assetIdx}`}
                                                  className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300"
                                                >
                                                  <span>
                                                    {asset.type} • {asset.title}
                                                  </span>
                                                  <a
                                                    className="text-primary underline"
                                                    href={asset.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                  >
                                                    開啟
                                                  </a>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {showAllFields &&
                                        !section.content &&
                                        !hasAssets && (
                                          <p className="text-xs text-text-sub">
                                            尚未提供章節內容
                                          </p>
                                        )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-border-light dark:border-border-dark">
                          <button
                            onClick={() =>
                              router.push(
                                `/teacher/courses/preview/${selectedCourse.id}`
                              )
                            }
                            className="w-full p-4 rounded-xl border border-dashed border-border-light dark:border-border-dark flex items-center justify-center gap-2 text-primary hover:bg-primary/5 transition-colors"
                          >
                            <span className="material-symbols-outlined">
                              visibility
                            </span>
                            預覽學生端頁面
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined text-6xl mb-4">
                    library_books
                  </span>
                  <p>請選擇一個課程方案</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
