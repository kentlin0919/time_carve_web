"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useModal } from "@/components/providers/ModalContext";
import type { Database } from "@/types/database.types";

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

type TeacherOption = { name: string; teacher_code: string };

type EditForm = {
  name: string;
  phone: string;
  isActive: boolean;
};

export function useAdminStudentsController() {
  const { showModal } = useModal();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">(
    "all"
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTeacherCode, setSelectedTeacherCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    phone: "",
    isActive: true,
  });

  const fetchTeachers = useCallback(async () => {
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
          .map((teacher) => ({
            name: teacher.user_info?.name || "未命名",
            teacher_code: teacher.teacher_code,
          }))
          .sort((left, right) => left.name.localeCompare(right.name));
        setTeachers(mappedTeachers);
      }
    } catch (error) {
      console.error("Error fetching teachers list:", error);
    }
  }, []);

  const fetchAllStudents = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.from("student_info").select(`
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

      if (error) throw error;

      if (data) {
        const nextStudents = data as unknown as StudentWithDetails[];
        setStudents(nextStudents);
        if (nextStudents.length > 0 && !selectedStudentId) {
          setSelectedStudentId(nextStudents[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    async function initData() {
      await fetchTeachers();
      await fetchAllStudents();
    }

    void initData();
  }, [fetchAllStudents, fetchTeachers]);

  useEffect(() => {
    setIsEditing(false);
  }, [selectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId),
    [selectedStudentId, students]
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const userInfo = student.user_info;
      const teacherInfo = student.teacher_info;

      if (statusFilter === "active" && userInfo && !userInfo.is_active) return false;
      if (statusFilter === "disabled" && userInfo && userInfo.is_active) return false;
      if (selectedTeacherCode && student.teacher_code !== selectedTeacherCode) return false;

      const searchLower = searchQuery.toLowerCase();
      const userName = userInfo?.name || "";
      const userEmail = userInfo?.email || "";
      const teacherName = teacherInfo?.user_info?.name || "";

      return (
        userName.toLowerCase().includes(searchLower) ||
        userEmail.toLowerCase().includes(searchLower) ||
        teacherName.toLowerCase().includes(searchLower) ||
        (student.student_code || "").toLowerCase().includes(searchLower)
      );
    });
  }, [searchQuery, selectedTeacherCode, statusFilter, students]);

  const activeCount = filteredStudents.length;

  const getAvatarChar = useCallback((name: string) => (name ? name.charAt(0) : "?"), []);

  const setSelectedStudent = useCallback((studentId: string) => {
    setSelectedStudentId(studentId);
  }, []);

  const handleEditClick = useCallback(() => {
    if (!selectedStudent || !selectedStudent.user_info) return;

    setEditForm({
      name: selectedStudent.user_info.name || "",
      phone: selectedStudent.user_info.phone || "",
      isActive: selectedStudent.user_info.is_active ?? true,
    });
    setIsEditing(true);
  }, [selectedStudent]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const updateEditForm = useCallback(
    <K extends keyof EditForm>(field: K, value: EditForm[K]) => {
      setEditForm((previous) => ({ ...previous, [field]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
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

      setStudents((previous) =>
        previous.map((student) => {
          if (student.id === selectedStudent.id && student.user_info) {
            return {
              ...student,
              user_info: {
                ...student.user_info,
                name: editForm.name,
                phone: editForm.phone,
                is_active: editForm.isActive,
              },
            };
          }
          return student;
        })
      );
      setIsEditing(false);
      showModal({
        title: "成功",
        description: "儲存成功！",
        confirmText: "確定",
      });
    } catch (error) {
      console.error("Error updating student:", error);
      showModal({
        title: "錯誤",
        description: `儲存失敗：${error instanceof Error ? error.message : "未知錯誤"}`,
        confirmText: "確定",
      });
    } finally {
      setSaving(false);
    }
  }, [editForm, selectedStudent, showModal]);

  const removeStudentLocally = useCallback((studentId: string) => {
    setStudents((previous) => {
      const remainingStudents = previous.filter((student) => student.id !== studentId);
      setSelectedStudentId(remainingStudents.length > 0 ? remainingStudents[0].id : null);
      return remainingStudents;
    });
    setIsEditing(false);
  }, []);

  const performDelete = useCallback(
    async (studentId: string, successTitle: string, successDescription: string) => {
      const { error } = await supabase.rpc("admin_delete_user", {
        target_user_id: studentId,
      });
      if (error) throw error;

      removeStudentLocally(studentId);
      showModal({
        title: successTitle,
        description: successDescription,
        confirmText: "確定",
      });
    },
    [removeStudentLocally, showModal]
  );

  const handleDelete = useCallback(() => {
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
          await performDelete(selectedStudent.user_info!.id, "已刪除", "學生帳號已永久刪除。");
        } catch (error) {
          console.error("Error deleting student:", error);
          showModal({
            title: "刪除失敗",
            description: error instanceof Error ? error.message : "發生未知錯誤",
            confirmText: "確定",
          });
        }
      },
    });
  }, [performDelete, selectedStudent, showModal]);

  const handleForceDeleteOrphanStudent = useCallback(() => {
    if (!selectedStudent) return;

    showModal({
      title: "強制刪除異常資料",
      description: "確定要強制刪除此異常的學生紀錄嗎？這會嘗試刪除對應的 User ID。",
      type: "warning",
      confirmText: "確認刪除",
      showCancel: true,
      cancelText: "取消",
      onConfirm: async () => {
        try {
          await performDelete(
            selectedStudent.id,
            "已刪除",
            "異常學生紀錄已強制刪除。"
          );
        } catch (error) {
          console.error(error);
          showModal({
            type: "error",
            title: "刪除失敗",
            description: error instanceof Error ? error.message : "未知錯誤",
            confirmText: "確定",
          });
        }
      },
    });
  }, [performDelete, selectedStudent, showModal]);

  return {
    loading,
    students,
    teachers,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedStudentId,
    selectedStudent,
    setSelectedStudent,
    selectedTeacherCode,
    setSelectedTeacherCode,
    isEditing,
    saving,
    editForm,
    updateEditForm,
    filteredStudents,
    activeCount,
    getAvatarChar,
    handleEditClick,
    handleCancelEdit,
    handleSave,
    handleDelete,
    handleForceDeleteOrphanStudent,
  };
}
