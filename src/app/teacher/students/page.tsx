"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { useModal } from "@/components/providers/ModalContext";
import { SendNotificationDialog } from "@/components/notification/SendNotificationDialog";
import { StudentProgressSection } from "./components/StudentProgressSection";

type StudentWithInfo = Database["public"]["Tables"]["student_info"]["Row"] & {
  user_info: Database["public"]["Tables"]["user_info"]["Row"] | null;
};

export default function TeacherStudentManagementPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithInfo[]>([]);
  const { showModal } = useModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    isActive: true,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  // When selected student changes, reset edit mode
  useEffect(() => {
    setIsEditing(false);
  }, [selectedStudentId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacherData, error: teacherError } = await supabase
        .from("teacher_info")
        .select("teacher_code, id")
        .eq("id", user.id)
        .single();

      if (user) setCurrentUserId(user.id);

      if (teacherError) throw teacherError;
      if (!teacherData) return;

      const { data: studentsData, error: studentsError } = await supabase
        .from("student_info")
        .select(`*, user_info (*)`)
        .eq("teacher_code", teacherData.teacher_code);

      if (studentsError) throw studentsError;

      if (studentsData) {
        setStudents(studentsData as unknown as StudentWithInfo[]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleEditClick = () => {
    if (!selectedStudent || !selectedStudent.user_info) return;
    setEditForm({
      name: selectedStudent.user_info.name || "",
      phone: selectedStudent.user_info.phone || "",
      isActive: selectedStudent.user_info.is_active ?? true,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedStudent || !selectedStudent.user_info) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("user_info")
        .update({
          name: editForm.name,
          phone: editForm.phone,
          is_active: editForm.isActive,
        })
        .eq("id", selectedStudent.user_info.id);

      if (error) throw error;

      // Update local state
      const updatedStudents = students.map((s) => {
        if (s.id === selectedStudent.id && s.user_info) {
          return {
            ...s,
            user_info: {
              ...s.user_info,
              name: editForm.name,
              phone: editForm.phone,
              is_active: editForm.isActive,
            },
          };
        }
        return s;
      });
      setStudents(updatedStudents);
      setIsEditing(false);
      showModal({
        title: "成功",
        description: "儲存成功！",
        confirmText: "確定",
      });
    } catch (error: any) {
      console.error("Error updating student:", error);
      showModal({
        title: "錯誤",
        description: "儲存失敗：" + error.message,
        confirmText: "確定",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const userInfo = student.user_info;
    if (!userInfo) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      userInfo.name.toLowerCase().includes(searchLower) ||
      userInfo.email.toLowerCase().includes(searchLower)
    );
  });

  const getAvatarChar = (name: string) => (name ? name.charAt(0) : "?");
  const activeCount = filteredStudents.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="w-full bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark px-8 py-4 flex justify-between items-center sticky top-0 z-10 transition-all">
        <div className="flex flex-col">
          <h2 className="text-slate-800 dark:text-white text-xl font-bold tracking-tight flex items-center gap-2">
            學生資訊管理
          </h2>
          <p className="text-text-sub dark:text-gray-400 text-sm mt-0.5">
            目前共有{" "}
            <span className="text-primary font-bold">{activeCount}</span>{" "}
            位活躍學生
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              className="pl-10 pr-4 py-2 w-64 rounded-lg border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
              placeholder="搜尋學生姓名、Email..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub group-focus-within:text-primary text-[18px] transition-colors">
              search
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-2xl border border-border-light dark:border-border-dark shadow-sm flex items-center justify-between relative overflow-hidden group">
              <div className="flex flex-col z-10">
                <p className="text-text-sub text-xs font-semibold uppercase tracking-wide">
                  我的學生
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                  {students.length}{" "}
                  <span className="text-sm font-normal text-text-sub">人</span>
                </p>
              </div>
              <div className="size-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">group</span>
              </div>
            </div>
          </div>

          {/* Two-Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-240px)] lg:h-[calc(100vh-280px)] min-h-[500px]">
            {/* Left ListView */}
            <div
              className={`lg:w-1/3 flex-col bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden ${selectedStudentId ? "hidden lg:flex" : "flex"
                }`}
            >
              <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white border border-border-light dark:border-border-dark">
                    全部
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-border-light dark:divide-border-dark">
                  {loading && (
                    <div className="p-8 text-center text-gray-500">
                      載入中...
                    </div>
                  )}
                  {!loading && filteredStudents.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      沒有找到符合的學生
                    </div>
                  )}

                  {filteredStudents.map((student) => {
                    const userInfo = student.user_info;
                    if (!userInfo) return null;
                    const isSelected = selectedStudentId === student.id;

                    return (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudentId(student.id)}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-l-4 ${isSelected
                            ? "border-primary bg-blue-50/50 dark:bg-blue-900/10"
                            : "border-transparent"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {userInfo.avatar_url ? (
                              <div
                                className="size-12 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover ring-2 ring-white dark:ring-slate-800 shadow-sm"
                                style={{
                                  backgroundImage: `url("${userInfo.avatar_url}")`,
                                }}
                              ></div>
                            ) : (
                              <div className="size-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-lg ring-2 ring-white dark:ring-slate-800 shadow-sm">
                                {getAvatarChar(userInfo.name)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                              {userInfo.name}
                            </h4>
                            <p className="text-xs text-text-sub truncate mt-0.5">
                              {userInfo.email}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 lg:hidden">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel - View or Edit */}
            <div
              className={`lg:w-2/3 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card flex-col overflow-hidden ${selectedStudentId ? "flex" : "hidden lg:flex"
                }`}
            >
              {selectedStudent && selectedStudent.user_info ? (
                isEditing ? (
                  // ========== EDIT MODE ==========
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Edit Header */}
                    <div className="p-4 md:p-6 border-b border-border-light dark:border-border-dark bg-slate-50/30 dark:bg-slate-800/30 flex items-center gap-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="lg:hidden mr-1 p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      >
                        <span className="material-symbols-outlined">
                          arrow_back
                        </span>
                      </button>
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined">
                          person_edit
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        編輯學生資料
                      </h2>
                    </div>

                    {/* Edit Content - Two Column Layout */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column - Profile Card */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border-light dark:border-border-dark p-6 flex flex-col items-center text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none"></div>
                            <div className="relative z-10 mb-4">
                              {selectedStudent.user_info.avatar_url ? (
                                <div
                                  className="size-28 rounded-full bg-center bg-cover shadow-md ring-4 ring-white dark:ring-surface-dark"
                                  style={{
                                    backgroundImage: `url("${selectedStudent.user_info.avatar_url}")`,
                                  }}
                                ></div>
                              ) : (
                                <div className="size-28 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-4xl font-bold shadow-md ring-4 ring-white dark:ring-surface-dark">
                                  {getAvatarChar(editForm.name)}
                                </div>
                              )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white z-10">
                              {editForm.name || "(未命名)"}
                            </h3>
                            <p className="text-sm text-text-sub mt-1 z-10">
                              學員編號: {selectedStudent.student_code || "N/A"}
                            </p>

                            {/* Account Status Toggle */}
                            <div className="w-full mt-6 pt-5 border-t border-border-light dark:border-border-dark flex justify-between items-center px-2">
                              <span className="text-sm font-medium text-slate-700 dark:text-gray-300">
                                帳號狀態
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  checked={editForm.isActive}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      isActive: e.target.checked,
                                    })
                                  }
                                  className="sr-only peer"
                                  type="checkbox"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                <span
                                  className={`ml-2 text-sm font-bold ${editForm.isActive
                                      ? "text-primary"
                                      : "text-slate-400"
                                    }`}
                                >
                                  {editForm.isActive ? "啟用中" : "已停用"}
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* System Info */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border-light dark:border-border-dark p-5">
                            <h4 className="text-xs font-bold text-text-sub uppercase tracking-wider mb-4">
                              系統資訊
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center border-b border-dashed border-border-light dark:border-border-dark pb-2">
                                <span className="text-text-sub flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[14px]">
                                    calendar_today
                                  </span>{" "}
                                  註冊日期
                                </span>
                                <span className="font-medium text-slate-800 dark:text-gray-300">
                                  {selectedStudent.created_at
                                    ? new Date(
                                      selectedStudent.created_at
                                    ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-text-sub flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[14px]">
                                    history
                                  </span>{" "}
                                  最後更新
                                </span>
                                <span className="font-medium text-slate-800 dark:text-gray-300">
                                  {selectedStudent.updated_at
                                    ? new Date(
                                      selectedStudent.updated_at
                                    ).toLocaleString()
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Form */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                          {/* Basic Info Section */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border-light dark:border-border-dark p-6 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-5">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined text-lg">
                                  badge
                                </span>
                              </div>
                              <h3 className="font-bold text-slate-800 dark:text-white">
                                基本資料
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-1.5 group">
                                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                                  真實姓名{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm dark:text-white"
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        name: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub text-[18px] group-focus-within:text-primary transition-colors">
                                    person
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1.5 group">
                                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                                  電子郵件
                                </label>
                                <div className="relative">
                                  <input
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed outline-none text-sm"
                                    type="email"
                                    value={selectedStudent.user_info.email}
                                    disabled
                                  />
                                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub text-[18px]">
                                    mail
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1.5 group">
                                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                                  聯絡電話
                                </label>
                                <div className="relative">
                                  <input
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm dark:text-white"
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        phone: e.target.value,
                                      })
                                    }
                                    placeholder="請輸入電話號碼"
                                  />
                                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub text-[18px] group-focus-within:text-primary transition-colors">
                                    call
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="absolute right-0 top-0 size-24 bg-blue-50/50 dark:bg-blue-900/5 rounded-bl-full pointer-events-none"></div>
                          </div>

                          {/* Placeholder for Course Info */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border-light dark:border-border-dark p-6 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-5">
                              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                <span className="material-symbols-outlined text-lg">
                                  school
                                </span>
                              </div>
                              <h3 className="font-bold text-slate-800 dark:text-white">
                                課程與學習狀態
                              </h3>
                            </div>
                            <div className="bg-white dark:bg-slate-800/50 rounded-lg p-2">
                              <StudentProgressSection
                                studentId={selectedStudent.id}
                                teacherId={currentUserId}
                              />
                            </div>
                            <div className="absolute right-0 top-0 size-24 bg-orange-50/50 dark:bg-orange-900/5 rounded-bl-full pointer-events-none"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit Footer */}
                    <div className="flex flex-col-reverse md:flex-row items-center justify-between p-4 md:p-5 border-t border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50 gap-4">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="w-full md:w-auto px-5 py-2 rounded-lg border border-border-light dark:border-border-dark text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          close
                        </span>
                        取消
                      </button>
                      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <span className="hidden md:flex text-xs text-text-sub items-center gap-1 bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-full text-blue-600 dark:text-blue-400">
                          <span className="material-symbols-outlined text-sm">
                            auto_fix_high
                          </span>
                          所有變更將自動記錄
                        </span>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="w-full md:w-auto px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? (
                            "儲存中..."
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-lg">
                                save
                              </span>
                              儲存更改
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // ========== VIEW MODE ==========
                  <>
                    <div className="p-4 md:p-6 border-b border-border-light dark:border-border-dark bg-slate-50/30 dark:bg-slate-800/30">
                      <div className="flex flex-col gap-4">
                        {/* Mobile Back Button & Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() => setSelectedStudentId(null)}
                              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <span className="material-symbols-outlined">
                                arrow_back
                              </span>
                            </button>
                            <div className="flex gap-3 md:gap-4 flex-1 min-w-0">
                              {selectedStudent.user_info.avatar_url ? (
                                <div
                                  className="size-16 md:size-24 rounded-2xl bg-slate-200 dark:bg-slate-700 bg-center bg-cover shadow-sm shrink-0"
                                  style={{
                                    backgroundImage: `url("${selectedStudent.user_info.avatar_url}")`,
                                  }}
                                ></div>
                              ) : (
                                <div className="size-16 md:size-24 rounded-2xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-2xl md:text-4xl shadow-sm shrink-0">
                                  {getAvatarChar(
                                    selectedStudent.user_info.name
                                  )}
                                </div>
                              )}

                              <div className="flex flex-col gap-1 justify-center min-w-0 flex-1">
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                  <span className="truncate">
                                    {selectedStudent.user_info.name}
                                  </span>
                                  {selectedStudent.user_info.is_active && (
                                    <span
                                      className="material-symbols-outlined text-green-500 fill-current text-lg md:text-xl shrink-0"
                                      title="已驗證"
                                    >
                                      verified
                                    </span>
                                  )}
                                </h2>
                                <div className="text-text-sub text-sm flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className="material-symbols-outlined text-sm shrink-0">
                                      mail
                                    </span>{" "}
                                    <span className="truncate">
                                      {selectedStudent.user_info.email}
                                    </span>
                                  </span>
                                  {selectedStudent.user_info.phone && (
                                    <span className="flex items-center gap-1.5 truncate">
                                      <span className="hidden md:inline text-gray-300 dark:text-gray-600">
                                        |
                                      </span>
                                      <span className="material-symbols-outlined text-sm shrink-0">
                                        call
                                      </span>{" "}
                                      {selectedStudent.user_info.phone}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-text-sub mt-1 hidden md:block">
                                  加入時間:{" "}
                                  {selectedStudent.created_at
                                    ? new Date(
                                      selectedStudent.created_at
                                    ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex gap-2 md:gap-3 justify-end border-t md:border-t-0 border-slate-200 dark:border-slate-700 pt-4 md:pt-0">
                          <SendNotificationDialog
                            recipientId={selectedStudent.user_info.id}
                            recipientName={selectedStudent.user_info.name}
                            trigger={
                              <button
                                className="flex-1 md:flex-none flex items-center justify-center h-10 px-4 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-text-sub hover:text-primary hover:border-primary transition-colors shadow-sm gap-2"
                                title="傳送通知"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  notifications
                                </span>
                                <span className="md:hidden text-sm">通知</span>
                              </button>
                            }
                          />
                          <button
                            onClick={handleEditClick}
                            className="flex-1 md:flex-none px-4 h-10 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit_square
                            </span>
                            編輯資料
                          </button>
                          <button className="flex items-center justify-center size-10 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-text-sub hover:text-primary hover:border-primary transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">
                              more_vert
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 bg-surface-light dark:bg-surface-dark">
                      <div className="text-center text-gray-400 py-10">
                        <span className="material-symbols-outlined text-4xl mb-2">
                          info
                        </span>
                        <p>更多學生詳情功能開發中</p>
                      </div>
                    </div>
                  </>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">
                    person_search
                  </span>
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                    請選擇一位學生
                  </p>
                  <p className="text-sm mt-1">點擊左側列表以查看詳細資訊</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
