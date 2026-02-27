"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database.types";
import { useModal } from "@/components/providers/ModalContext";
import EducationInputs from "@/components/ui/EducationInputs";

type UserInfo = Database["public"]["Tables"]["user_info"]["Row"];
type TeacherInfo = Database["public"]["Tables"]["teacher_info"]["Row"];
type TeacherEducation =
  Database["public"]["Tables"]["teacher_education"]["Row"] & {
    schools: { name: string } | null;
    education_statuses: { status_key: string } | null;
  };

type TeacherData = UserInfo & {
  teacher_info:
  | (TeacherInfo & { teacher_education: TeacherEducation[] })
  | null;
};

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit Mode
  const [editingTeacher, setEditingTeacher] = useState<TeacherData | null>(
    null
  );
  const { showModal } = useModal();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_info")
        .select(
          `
          *,
          teacher_info (
            *,
            teacher_education (
              *,
              schools (name),
              education_statuses (status_key)
            )
          )
        `
        )
        .eq("identity_id", 2)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching teachers:", error);
        return;
      }

      setTeachers(data as TeacherData[]);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (teacher: TeacherData) => {
    setEditingTeacher(teacher);
  };

  const handleUpdateTeacher = async (formData: any) => {
    if (!editingTeacher) return;

    let schoolId: string | null = null;
    let statusId: number | null = null;

    try {
      // 1. Update user_info
      const { error: userError } = await supabase
        .from("user_info")
        .update({
          name: formData.name,
          phone: formData.phone,
          is_active: formData.is_active,
        })
        .eq("id", editingTeacher.id);

      if (userError) throw userError;

      // 2. Update teacher_info
      if (editingTeacher.teacher_info) {
        const { error: teacherError } = await supabase
          .from("teacher_info")
          .update({
            title: formData.title,
            bio: formData.bio,
            base_price: formData.base_price,
            experience_years: formData.experience_years,
            is_public: formData.is_public,
          })
          .eq("id", editingTeacher.id);

        if (teacherError) throw teacherError;

        // 3. Update teacher_education
        // Resolve IDs
        // 3. Update teacher_education
        // Resolve IDs
        if (formData.school) {
          const { data: schoolData } = await supabase
            .from("schools")
            .select("id")
            .eq("name", formData.school)
            .single();
          schoolId = schoolData?.id || null;
        }

        if (formData.status) {
          const { data: statusData } = await supabase
            .from("education_statuses")
            .select("id")
            .eq("status_key", formData.status)
            .single();
          statusId = statusData?.id || null;
        }

        if (schoolId && statusId) {
          // Check if exists
          const existingEdu =
            editingTeacher.teacher_info.teacher_education?.[0];

          if (existingEdu) {
            await supabase
              .from("teacher_education")
              .update({
                school_id: schoolId,
                status_id: statusId,
                department: formData.department,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingEdu.id);
          } else {
            await supabase.from("teacher_education").insert({
              teacher_id: editingTeacher.teacher_info.id,
              school_id: schoolId,
              status_id: statusId,
              department: formData.department,
            });
          }
        }
      }

      // 3. Update local state
      setTeachers(
        teachers.map((t) => {
          if (t.id === editingTeacher.id) {
            return {
              ...t,
              name: formData.name,
              phone: formData.phone,
              is_active: formData.is_active,
              teacher_info: t.teacher_info
                ? {
                  ...t.teacher_info,
                  title: formData.title,
                  bio: formData.bio,
                  base_price: formData.base_price,
                  experience_years: formData.experience_years,
                  is_public: formData.is_public,
                  // Optimistic update of education
                  teacher_education: [
                    {
                      ...(t.teacher_info?.teacher_education?.[0] || {}), // Keep ID if exists
                      id:
                        t.teacher_info?.teacher_education?.[0]?.id ||
                        "temp-id",
                      teacher_id: t.id,
                      school_id: schoolId || "", // Might be null if not found (unexpected)
                      status_id: statusId || 0,
                      department: formData.department,
                      schools: { name: formData.school },
                      education_statuses: { status_key: formData.status },
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    } as any, // TS hack for simple optimistic update
                  ],
                }
                : null,
            };
          }
          return t;
        })
      );

      setEditingTeacher(null);
      showModal({
        title: "更新成功",
        description: "教師資料已更新",
        type: "success",
      });
    } catch (error: any) {
      console.error("Update error:", error);
      showModal({
        title: "更新失敗",
        description: error.message,
        type: "error",
      });
    }
  };

  const handleDeleteTeacher = async (teacher: TeacherData) => {
    showModal({
      title: "永久刪除確認",
      description: `您確定要永久刪除教師「${teacher.name}」嗎？此操作將刪除其所有課程、預約與關聯資料，且無法復原。`,
      type: "warning",
      confirmText: "確認刪除",
      showCancel: true,
      cancelText: "取消",
      onConfirm: async () => {
        try {
          const { error } = await supabase.rpc("admin_delete_user", {
            target_user_id: teacher.id,
          });

          if (error) throw error;

          setTeachers(teachers.filter((t) => t.id !== teacher.id));
          if (editingTeacher?.id === teacher.id) {
            setEditingTeacher(null);
          }

          showModal({
            title: "刪除成功",
            description: "該教師帳號已永久刪除",
            type: "success",
          });
        } catch (error: any) {
          console.error("Delete error:", error);
          showModal({
            title: "刪除失敗",
            description: error.message,
            type: "error",
          });
        }
      },
    });
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      searchQuery === "" ||
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "" ||
      (statusFilter === "active" ? teacher.is_active : !teacher.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 px-6 py-8 md:px-12 md:py-10 max-w-[1400px] mx-auto w-full">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            教師管理
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            管理所有註冊教師的帳號權限、狀態與維護費方案
          </p>
        </div>
        <Link
          href="/admin/teachers/new"
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl h-12 px-6 bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="text-sm font-bold tracking-wide">新增教師</span>
        </Link>
      </header>
      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        {/* Search Input */}
        <div className="flex-1 relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-gray-500 group-focus-within:text-sky-500 transition-colors">
            search
          </span>
          <input
            className="w-full h-12 pl-12 pr-4 rounded-lg bg-gray-50 dark:bg-gray-900 border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400/70 transition-all outline-none"
            placeholder="搜尋姓名或電子郵件..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Filters */}
        <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0">
          <div className="relative min-w-[160px]">
            <select
              className="w-full h-12 pl-4 pr-10 appearance-none rounded-lg bg-gray-50 dark:bg-gray-900 border-transparent focus:border-sky-500 focus:ring-0 text-gray-900 dark:text-white cursor-pointer outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">所有狀態</option>
              <option value="active">啟用中</option>
              <option value="disabled">已停用</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 pointer-events-none text-sm">
              expand_more
            </span>
          </div>
        </div>
      </div>
      {/* Stats Summary (Quick View) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              總教師數
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {teachers.length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-3">
          <div className="size-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              啟用中
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {teachers.filter((t) => t.is_active).length}
            </p>
          </div>
        </div>
      </div>
      {/* Data Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[280px]">
                  教師姓名
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[240px]">
                  電子郵件
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  學歷
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    載入中...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    查無資料
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className={`group transition-colors ${!teacher.is_active
                        ? "bg-gray-50/50 dark:bg-gray-900/30"
                        : "hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                      }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-10 rounded-full bg-cover bg-center shrink-0 border border-gray-200 dark:border-gray-700 bg-sky-100 flex items-center justify-center text-sky-600 font-bold"
                          style={
                            teacher.avatar_url
                              ? {
                                backgroundImage: `url(${teacher.avatar_url})`,
                              }
                              : {}
                          }
                        >
                          {!teacher.avatar_url && teacher.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-bold ${!teacher.is_active
                                ? "text-gray-500"
                                : "text-gray-900 dark:text-white"
                              }`}
                          >
                            {teacher.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
                            {teacher.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {teacher.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400 block max-w-full sm:max-w-[200px] truncate">
                        {(() => {
                          const edu =
                            teacher.teacher_info?.teacher_education?.[0];
                          if (!edu) return "-";
                          return (
                            <>
                              <span className="text-gray-900 dark:text-white font-medium">
                                {edu.schools?.name}
                              </span>
                              {edu.department && (
                                <span className="text-xs ml-1.5 text-gray-500">
                                  {" "}
                                  {edu.department}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {teacher.is_active ? (
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            啟用中
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-gray-400"></span>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            已停用
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(teacher)}
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="編輯"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher)}
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                          title="刪除"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher}
          onClose={() => setEditingTeacher(null)}
          onSave={handleUpdateTeacher}
          onDelete={() => handleDeleteTeacher(editingTeacher)}
        />
      )}
    </div>
  );
}

function EditTeacherModal({
  teacher,
  onClose,
  onSave,
  onDelete,
}: {
  teacher: TeacherData;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete: () => void;
}) {
  const edu = teacher.teacher_info?.teacher_education?.[0];
  const [formData, setFormData] = useState({
    name: teacher.name,
    phone: teacher.phone || "",
    is_active: teacher.is_active,
    title: teacher.teacher_info?.title || "",
    bio: teacher.teacher_info?.bio || "",
    base_price: teacher.teacher_info?.base_price || 0,
    experience_years: teacher.teacher_info?.experience_years || 0,
    is_public: teacher.teacher_info?.is_public ?? false,
    school: edu?.schools?.name || "",
    status: edu?.education_statuses?.status_key || "studying",
    department: edu?.department || "",
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur z-10 rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            編輯教師資料
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Account Status */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                帳號狀態
              </p>
              <p className="text-xs text-text-sub mt-0.5">
                停用後教師將無法登入且不顯示於前台
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="sr-only peer"
                type="checkbox"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="ml-2 text-sm font-bold text-primary">
                {formData.is_active ? "啟用中" : "已停用"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                姓名
              </label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                連絡電話
              </label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            {/* Replaced Title with EducationInputs */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                學歷資訊
              </label>
              <EducationInputs
                school={formData.school}
                setSchool={(v) =>
                  setFormData((prev) => ({ ...prev, school: v }))
                }
                status={formData.status}
                setStatus={(v) =>
                  setFormData((prev) => ({ ...prev, status: v }))
                }
                department={formData.department}
                setDepartment={(v) =>
                  setFormData((prev) => ({ ...prev, department: v }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                年資 (年)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.experience_years}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experience_years: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                基礎價格
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.base_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    base_price: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                公開顯示資料
              </label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.is_public ? "true" : "false"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_public: e.target.value === "true",
                  })
                }
              >
                <option value="true">公開</option>
                <option value="false">隱藏</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              個人簡介 (Bio)
            </label>
            <textarea
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />
          </div>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-red-100 dark:border-red-900/30">
            <h4 className="text-red-600 font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              危險操作
            </h4>
            <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-4 rounded-xl">
              <p className="text-sm text-red-600/80">
                永久刪除此帳號與所有資料
              </p>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                永久刪除
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 rounded-b-2xl bg-gray-50/50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold"
          >
            取消
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/30 font-bold"
          >
            儲存變更
          </button>
        </div>
      </div>
    </div>
  );
}
