"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";

const ROLE_MAP: Record<number, string> = {
  1: "Admin",
  2: "Teacher",
  3: "Student",
};

type UserInfo = Database["public"]["Tables"]["user_info"]["Row"];
type StudentInfo = Database["public"]["Tables"]["student_info"]["Row"];
type TeacherInfo = Database["public"]["Tables"]["teacher_info"]["Row"];
type Identity = Database["public"]["Tables"]["identity"]["Row"];

export type AdminUser = UserInfo & {
  identity: Identity | null;
  student_info: StudentInfo | null;
  teacher_info: TeacherInfo | null;
};

export function useAdminUsersController() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [formUser, setFormUser] = useState<Partial<UserInfo>>({});
  const [formStudent, setFormStudent] = useState<Partial<StudentInfo>>({});
  const [formTeacher, setFormTeacher] = useState<Partial<TeacherInfo>>({});
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("user_info")
      .select(
        `*,
        identity:identity_id ( identity_id, name ),
        student_info ( id, student_code, teacher_code, created_at, updated_at ),
        teacher_info ( id, teacher_code, title, experience_years, base_price, is_public, bio, created_at, updated_at )
        `
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching users:", fetchError);
      setError("讀取使用者失敗，請稍後再試。");
    } else {
      setUsers((data || []) as AdminUser[]);
      if (data && data.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].id);
      }
    }

    setLoading(false);
  }, [selectedUserId]);

  const fetchIdentities = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("identity")
      .select("identity_id, name")
      .order("identity_id", { ascending: true });

    if (fetchError) {
      console.error("Error fetching identities:", fetchError);
      return;
    }

    setIdentities(data || []);
  }, []);

  useEffect(() => {
    void fetchUsers();
    void fetchIdentities();
  }, [fetchIdentities, fetchUsers]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, users]
  );

  useEffect(() => {
    if (!selectedUser) return;

    setFormUser({
      id: selectedUser.id,
      name: selectedUser.name,
      email: selectedUser.email,
      phone: selectedUser.phone,
      avatar_url: selectedUser.avatar_url,
      identity_id: selectedUser.identity_id,
      is_active: selectedUser.is_active,
      is_first_login: selectedUser.is_first_login ?? false,
      disabled_reason: selectedUser.disabled_reason,
      disabled_at: selectedUser.disabled_at,
    });
    setFormStudent(selectedUser.student_info || {});
    setFormTeacher(selectedUser.teacher_info || {});
    setEditing(false);
    setError(null);
    setPassword("");
    setPasswordConfirm("");
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? user.is_active
            : !user.is_active;
      const matchesRole =
        roleFilter === "all" ? true : String(user.identity_id || "") === roleFilter;

      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  const identityOptions = useMemo(() => {
    if (identities.length > 0) return identities;
    if (!selectedUser?.identity_id) return [];
    return [
      {
        identity_id: selectedUser.identity_id,
        name: ROLE_MAP[selectedUser.identity_id] || `身份 ${selectedUser.identity_id}`,
      },
    ];
  }, [identities, selectedUser?.identity_id]);

  const roleId = formUser.identity_id ?? selectedUser?.identity_id ?? null;

  const showStudentSection = useMemo(() => {
    if (editing && roleId === 3) return true;
    return Boolean(formStudent.student_code || formStudent.teacher_code);
  }, [editing, roleId, formStudent.student_code, formStudent.teacher_code]);

  const showTeacherSection = useMemo(() => {
    if (editing && roleId === 2) return true;
    return Boolean(
      formTeacher.teacher_code ||
        formTeacher.title ||
        formTeacher.experience_years ||
        formTeacher.base_price ||
        formTeacher.is_public ||
        formTeacher.bio
    );
  }, [
    editing,
    roleId,
    formTeacher.teacher_code,
    formTeacher.title,
    formTeacher.experience_years,
    formTeacher.base_price,
    formTeacher.is_public,
    formTeacher.bio,
  ]);

  const setSelectedUser = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  const toggleEditing = useCallback(() => {
    setEditing((previous) => !previous);
  }, []);

  const updateFormUser = useCallback(
    <K extends keyof UserInfo>(field: K, value: UserInfo[K] | null) => {
      setFormUser((previous) => ({ ...previous, [field]: value }));
    },
    []
  );

  const updateFormStudent = useCallback(
    <K extends keyof StudentInfo>(field: K, value: StudentInfo[K] | null) => {
      setFormStudent((previous) => ({ ...previous, [field]: value }));
    },
    []
  );

  const updateFormTeacher = useCallback(
    <K extends keyof TeacherInfo>(field: K, value: TeacherInfo[K] | null) => {
      setFormTeacher((previous) => ({ ...previous, [field]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!selectedUser || !formUser.id) return;

    setSaving(true);
    setError(null);

    try {
      if (formUser.identity_id === 3 && !formStudent.teacher_code) {
        throw new Error("學生身分需填寫綁定教師代碼。");
      }

      const emailChanged = formUser.email && formUser.email !== selectedUser.email;

      if (emailChanged) {
        const response = await fetch("/api/admin/users/update-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUser.id,
            email: formUser.email,
          }),
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error || "更新 Email 失敗");
        }
      }

      const { error: userError } = await supabase
        .from("user_info")
        .update({
          name: formUser.name,
          phone: formUser.phone,
          avatar_url: formUser.avatar_url,
          identity_id: formUser.identity_id,
          is_active: formUser.is_active,
          is_first_login: formUser.is_first_login,
          disabled_reason: formUser.disabled_reason,
          disabled_at: formUser.disabled_at,
        })
        .eq("id", selectedUser.id);

      if (userError) throw userError;

      if (formUser.identity_id === 3) {
        if (!selectedUser.student_info) {
          const { error: studentCreateError } = await supabase
            .from("student_info")
            .insert({
              id: selectedUser.id,
              student_code: formStudent.student_code || null,
              teacher_code: formStudent.teacher_code || "",
            });

          if (studentCreateError) throw studentCreateError;
        }

        const { error: studentError } = await supabase
          .from("student_info")
          .update({
            student_code: formStudent.student_code,
            teacher_code: formStudent.teacher_code,
          })
          .eq("id", selectedUser.id);

        if (studentError) throw studentError;
      }

      if (formUser.identity_id === 2) {
        if (!selectedUser.teacher_info) {
          let teacherCode = formTeacher.teacher_code;

          if (!teacherCode) {
            const { data: generatedCode, error: codeError } = await supabase.rpc(
              "generate_teacher_code"
            );
            if (codeError) throw codeError;
            teacherCode = generatedCode as string;
          }

          const { error: teacherCreateError } = await supabase
            .from("teacher_info")
            .insert({
              id: selectedUser.id,
              teacher_code: teacherCode,
              title: formTeacher.title || null,
              bio: formTeacher.bio || null,
              experience_years: formTeacher.experience_years ?? null,
              base_price: formTeacher.base_price ?? null,
              is_public: formTeacher.is_public ?? false,
            });

          if (teacherCreateError) throw teacherCreateError;
        }

        const { error: teacherError } = await supabase
          .from("teacher_info")
          .update({
            teacher_code: formTeacher.teacher_code,
            title: formTeacher.title,
            experience_years: formTeacher.experience_years,
            base_price: formTeacher.base_price,
            is_public: formTeacher.is_public,
            bio: formTeacher.bio,
          })
          .eq("id", selectedUser.id);

        if (teacherError) throw teacherError;
      }

      await fetchUsers();
      setEditing(false);
    } catch (caughtError: unknown) {
      console.error("Error saving user:", caughtError);
      setError(caughtError instanceof Error ? caughtError.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }, [fetchUsers, formStudent, formTeacher, formUser, selectedUser]);

  const handlePasswordReset = useCallback(async () => {
    if (!selectedUser || !password || !passwordConfirm) {
      setError("請輸入新密碼並再次確認。");
      return;
    }

    if (password !== passwordConfirm) {
      setError("兩次輸入的密碼不一致。");
      return;
    }

    setPasswordSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users/update-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          password,
          setFirstLogin: false,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "更新密碼失敗");
      }

      setFormUser((previous) => ({ ...previous, is_first_login: false }));
      setPassword("");
      setPasswordConfirm("");
    } catch (caughtError: unknown) {
      console.error("Password reset error:", caughtError);
      setError(caughtError instanceof Error ? caughtError.message : "更新密碼失敗");
    } finally {
      setPasswordSaving(false);
    }
  }, [password, passwordConfirm, selectedUser]);

  return {
    users,
    identities,
    loading,
    selectedUserId,
    selectedUser,
    editing,
    saving,
    passwordSaving,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    formUser,
    formStudent,
    formTeacher,
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    filteredUsers,
    identityOptions,
    showStudentSection,
    showTeacherSection,
    roleMap: ROLE_MAP,
    setSelectedUser,
    toggleEditing,
    updateFormUser,
    updateFormStudent,
    updateFormTeacher,
    handleSave,
    handlePasswordReset,
  };
}
