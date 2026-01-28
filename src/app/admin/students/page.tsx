"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { useModal } from "@/components/providers/ModalContext";


// Define types for joined data
type StudentWithDetails =
  Database["public"]["Tables"]["student_info"]["Row"] & {
    user_info: Database["public"]["Tables"]["user_info"]["Row"] | null;
    teacher_info:
    | (Database["public"]["Tables"]["teacher_info"]["Row"] & {
      user_info: Pick<
        Database["public"]["Tables"]["user_info"]["Row"],
        "name" | "email"
      > | null;
    })
    | null;
  };

export default function AdminStudentManagementPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const { showModal } = useModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "disabled"
  >("all");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );

  // Teacher Filter State
  const [teachers, setTeachers] = useState<
    { name: string; teacher_code: string }[]
  >([]);
  const [selectedTeacherCode, setSelectedTeacherCode] = useState<string>("");

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    isActive: true,
  });

  useEffect(() => {
    const initData = async () => {
      await fetchTeachers();
      await fetchAllStudents();
    };
    initData();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase.from("teacher_info").select(`
          teacher_code,
          user_info (
            name
          )
        `);

      if (error) {
        console.error("Error fetching teachers:", error);
        return;
      }

      if (data) {
        const mappedTeachers = data
          .map((t) => ({
            name: t.user_info?.name || "未命名",
            teacher_code: t.teacher_code,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setTeachers(mappedTeachers);
      }
    } catch (error) {
      console.error("Error fetching teachers list:", error);
    }
  };

  // When selected student changes, reset edit mode
  useEffect(() => {
    setIsEditing(false);
  }, [selectedStudentId]);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);

      // Admin fetches ALL students with their user info AND teacher info
      const { data: studentsData, error: studentsError } = await supabase.from(
        "student_info"
      ).select(`
          *,
          user_info (*),
          teacher_info (
            *,
            user_info (
              name,
              email
            )
          )
        `);

      if (studentsError) throw studentsError;

      if (studentsData) {
        setStudents(studentsData as unknown as StudentWithDetails[]);
        if (studentsData.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studentsData[0].id);
        }
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

  const handleDelete = async () => {
    if (!selectedStudent || !selectedStudent.user_info) return;

    showModal({
      title: "永久刪除確認",
      description:
        "您確定要「永久刪除」此學生帳號嗎？此操作無法復原，將連同所有關聯資料一起刪除。",
      type: "warning",
      confirmText: "確認刪除",
      showCancel: true,
      cancelText: "取消",
      onConfirm: async () => {
        try {
          const { error } = await supabase.rpc("admin_delete_user", {
            target_user_id: selectedStudent.user_info!.id,
          });

          if (error) throw error;

          // Update local state
          const remainingStudents = students.filter(
            (s) => s.id !== selectedStudent.id
          );
          setStudents(remainingStudents);
          setSelectedStudentId(
            remainingStudents.length > 0 ? remainingStudents[0].id : null
          );
          setIsEditing(false);

          showModal({
            title: "已刪除",
            description: "學生帳號已永久刪除。",
            confirmText: "確定",
          });
        } catch (error: any) {
          console.error("Error deleting student:", error);
          showModal({
            title: "刪除失敗",
            description: error.message || "發生未知錯誤",
            confirmText: "確定",
          });
        }
      },
    });
  };

  const filteredStudents = students.filter((student) => {
    const userInfo = student.user_info;
    const teacherInfo = student.teacher_info;

    // Note: We intentionally DO NOT return false if userInfo is missing,
    // so that "orphan" student records can still be seen and deleted/managed by Admin.

    // Filter by Status
    // If userInfo is missing, we consider it "active" (or neutral) for filter purposes,
    // or you might decide to show them only in "active" or "all".
    // Here we treat missing userInfo as "potentially active" but effectively "all".
    if (statusFilter === "active" && userInfo && !userInfo.is_active)
      return false;
    if (statusFilter === "disabled" && userInfo && userInfo.is_active)
      return false;

    // Link: student -> teacher_code, teacher -> teacher_code
    // Note: student_info has teacher_code directly.
    if (selectedTeacherCode && student.teacher_code !== selectedTeacherCode)
      return false;

    const searchLower = searchQuery.toLowerCase();
    const userName = userInfo?.name || "";
    const userEmail = userInfo?.email || "";
    const teacherName = teacherInfo?.user_info?.name || "";

    // Search by student name, email, OR teacher name
    return (
      userName.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      teacherName.toLowerCase().includes(searchLower) ||
      (student.student_code || "").toLowerCase().includes(searchLower)
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
            學生管理 (Admin)
          </h2>
          <p className="text-text-sub dark:text-gray-400 text-sm mt-0.5">
            共有 <span className="text-primary font-bold">{activeCount}</span>{" "}
            位學生資料
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              className="pl-10 pr-4 py-2 w-64 rounded-lg border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
              placeholder="搜尋學生、Email或所屬教師..."
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
                  總學生數
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
            {/* Can add more admin specific stats here */}
          </div>

          {/* Two-Column Layout */}
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]">
            {/* Left ListView */}
            <div className="lg:w-1/3 flex flex-col bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-card overflow-hidden">
              <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm border transition-colors ${statusFilter === "all"
                      ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white border-border-light dark:border-border-dark"
                      : "text-text-sub hover:bg-white/50"
                      }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm border transition-colors ${statusFilter === "active"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "text-text-sub hover:bg-white/50 border-transparent"
                      }`}
                  >
                    啟用中
                  </button>
                  <button
                    onClick={() => setStatusFilter("disabled")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm border transition-colors ${statusFilter === "disabled"
                      ? "bg-gray-100 text-gray-500 border-gray-200"
                      : "text-text-sub hover:bg-white/50 border-transparent"
                      }`}
                  >
                    已停用
                  </button>

                  {/* Teacher Filter Dropdown */}
                  <div className="relative ml-2">
                    <select
                      className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg shadow-sm border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                      value={selectedTeacherCode}
                      onChange={(e) => setSelectedTeacherCode(e.target.value)}
                    >
                      <option value="">所有教師</option>
                      {teachers.map((teacher) => (
                        <option
                          key={teacher.teacher_code}
                          value={teacher.teacher_code}
                        >
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none material-symbols-outlined text-[16px] text-text-sub">
                      expand_more
                    </span>
                  </div>
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
                    const teacherInfo = student.teacher_info;

                    const isSelected = selectedStudentId === student.id;
                    const isInvalid = !userInfo;

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
                            {userInfo?.avatar_url ? (
                              <div
                                className="size-12 rounded-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover ring-2 ring-white dark:ring-slate-800 shadow-sm"
                                style={{
                                  backgroundImage: `url("${userInfo.avatar_url}")`,
                                }}
                              ></div>
                            ) : (
                              <div
                                className={`size-12 rounded-full flex items-center justify-center font-bold text-lg ring-2 ring-white dark:ring-slate-800 shadow-sm ${isInvalid
                                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                                  }`}
                              >
                                {isInvalid
                                  ? "!"
                                  : getAvatarChar(userInfo!.name)}
                              </div>
                            )}
                            {userInfo && !userInfo.is_active && (
                              <div
                                className="absolute -bottom-1 -right-1 size-4 bg-gray-400 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center"
                                title="已停用"
                              >
                                <span className="material-symbols-outlined text-[10px] text-white">
                                  block
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-sm font-bold truncate ${isInvalid
                                ? "text-red-600 dark:text-red-400 italic"
                                : userInfo!.is_active
                                  ? "text-slate-800 dark:text-white"
                                  : "text-gray-400 dark:text-gray-500"
                                }`}
                            >
                              {isInvalid
                                ? "資料異常 (User Missing)"
                                : userInfo!.name}
                            </h4>
                            <p className="text-xs text-text-sub truncate mt-0.5">
                              {isInvalid
                                ? "此學生缺少 User Info"
                                : userInfo!.email}
                            </p>
                            {/* Display Teacher Info for Admin */}
                            {teacherInfo && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded w-fit">
                                <span className="material-symbols-outlined text-[12px]">
                                  school
                                </span>
                                <span>{teacherInfo.user_info?.name}</span>
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
              {selectedStudent ? (
                // Safe check: if user_info is missing, we only allow "Delete" (handled in dangerous zone or special view)
                // For now, if no user_info, we show a special "Invalid Data" view.
                !selectedStudent.user_info ? (
                  <div className="flex flex-col h-full items-center justify-center p-8 text-center">
                    <div className="size-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-4xl">
                        warning
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                      資料異常
                    </h2>
                    <p className="text-text-sub max-w-md">
                      此學生紀錄缺少關聯的 User Info 資料 (ID:{" "}
                      {selectedStudent.id})。
                      <br />
                      可能是因為 RLS 權限問題或原始資料已被刪除。
                    </p>
                    {/* Note: We cannot "permanently delete via user id" if user_info is missing, 
                          because admin_delete_user likely expects a user_id. 
                          But actually admin_delete_user takes target_user_id. 
                          Wait, student_info.id IS the user_id (one-to-one). 
                          So we CAN delete it using student.id! 
                      */}
                    <button
                      onClick={() => {
                        // Special handler for orphan student delete
                        // Using the student.id as the target_user_id since they are 1:1
                        showModal({
                          title: "強制刪除異常資料",
                          description:
                            "確定要強制刪除此異常的學生紀錄嗎？這會嘗試刪除對應的 User ID。",
                          type: "warning",
                          confirmText: "確認刪除",
                          showCancel: true,
                          cancelText: "取消",
                          onConfirm: async () => {
                            try {
                              const { error } = await supabase.rpc(
                                "admin_delete_user",
                                {
                                  target_user_id: selectedStudent.id,
                                }
                              );
                              if (error) throw error;
                              const remaining = students.filter(
                                (s) => s.id !== selectedStudent.id
                              );
                              setStudents(remaining);
                              setSelectedStudentId(
                                remaining.length > 0 ? remaining[0].id : null
                              );
                            } catch (e: any) {
                              console.error(e);
                              showModal({ type: "error", title: "刪除失敗", description: e.message, confirmText: "確定" });
                            }
                          },
                        });
                      }}
                      className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      強制刪除此紀錄
                    </button>
                  </div>
                ) : isEditing ? (
                  // ========== EDIT MODE ==========
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-border-light dark:border-border-dark bg-slate-50/30 dark:bg-slate-800/30 flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined">
                          person_edit
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        編輯學生資料
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Profile */}
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

                          {/* Teacher Info Card (Admin View Only) */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border-light dark:border-border-dark p-5">
                            <h4 className="text-xs font-bold text-text-sub uppercase tracking-wider mb-4">
                              所屬教師
                            </h4>
                            {selectedStudent.teacher_info ? (
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                  {getAvatarChar(
                                    selectedStudent.teacher_info.user_info
                                      ?.name || ""
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                                    {
                                      selectedStudent.teacher_info.user_info
                                        ?.name
                                    }
                                  </p>
                                  <p className="text-xs text-text-sub">
                                    {
                                      selectedStudent.teacher_info.user_info
                                        ?.email
                                    }
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">
                                未指定教師
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Form */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
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

                          {/* DANGER ZONE */}
                          <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 p-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                                <span className="material-symbols-outlined text-lg">
                                  warning
                                </span>
                              </div>
                              <h3 className="font-bold text-red-700 dark:text-red-400">
                                危險區域
                              </h3>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-sm text-red-600/70 dark:text-red-400/70">
                                永久刪除此學生使用者及其所有資料，此操作無法復原。
                              </p>
                              <button
                                onClick={handleDelete}
                                type="button"
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete_forever
                                </span>
                                永久刪除
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-5 border-t border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2 rounded-lg border border-border-light dark:border-border-dark text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          close
                        </span>
                        取消
                      </button>
                      <div className="flex items-center gap-4">
                        <span className="hidden md:flex text-xs text-text-sub items-center gap-1 bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-full text-blue-600 dark:text-blue-400">
                          <span className="material-symbols-outlined text-sm">
                            auto_fix_high
                          </span>
                          所有變更將自動記錄
                        </span>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 font-bold text-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="p-6 border-b border-border-light dark:border-border-dark bg-slate-50/30 dark:bg-slate-800/30">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          {selectedStudent.user_info.avatar_url ? (
                            <div
                              className="size-24 rounded-2xl bg-slate-200 dark:bg-slate-700 bg-center bg-cover shadow-sm"
                              style={{
                                backgroundImage: `url("${selectedStudent.user_info.avatar_url}")`,
                              }}
                            ></div>
                          ) : (
                            <div className="size-24 rounded-2xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-4xl shadow-sm">
                              {getAvatarChar(selectedStudent.user_info.name)}
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5 justify-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {selectedStudent.user_info.name}
                              {selectedStudent.user_info.is_active ? (
                                <span
                                  className="material-symbols-outlined text-green-500 fill-current text-xl"
                                  title="已驗證"
                                >
                                  verified
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold">
                                  已停用
                                </span>
                              )}
                            </h2>
                            <p className="text-text-sub text-sm flex items-center gap-3">
                              <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">
                                  mail
                                </span>{" "}
                                {selectedStudent.user_info.email}
                              </span>
                              {selectedStudent.user_info.phone && (
                                <>
                                  <span className="text-gray-300 dark:text-gray-600">
                                    |
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">
                                      call
                                    </span>{" "}
                                    {selectedStudent.user_info.phone}
                                  </span>
                                </>
                              )}
                            </p>

                            {/* Teacher Info in Detail View */}
                            {selectedStudent.teacher_info && (
                              <p className="text-xs text-text-sub mt-1 flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">
                                    school
                                  </span>
                                  指導老師：
                                  {selectedStudent.teacher_info.user_info?.name}
                                </span>
                                <span>
                                  加入時間:{" "}
                                  {selectedStudent.created_at
                                    ? new Date(
                                      selectedStudent.created_at
                                    ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleEditClick}
                            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 font-bold text-sm transition-all active:scale-95 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit_square
                            </span>
                            編輯資料
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
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined text-6xl mb-4">
                    person_search
                  </span>
                  <p>請選擇一位學生以查看詳情</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
