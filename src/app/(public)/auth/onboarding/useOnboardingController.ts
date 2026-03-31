"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthService } from "@/lib/application/auth/AuthService";
import { SupabaseAuthRepository } from "@/lib/infrastructure/auth/SupabaseAuthRepository";
import { useModal } from "@/components/providers/ModalContext";
import type { Database } from "@/types/database.types";

const authRepository = new SupabaseAuthRepository();
const authService = new AuthService(authRepository);

type UserInfoRow = Pick<
  Database["public"]["Tables"]["user_info"]["Row"],
  "id" | "identity_id" | "name"
>;

type EducationSummary = {
  id: string;
  department: string | null;
  degreeLevel: string | null;
  statusId: number;
  schoolName: string | null;
};

const STUDENT_STATUS_MAP: Record<number, string> = {
  1: "studying",
  2: "graduated",
  3: "dropped_out",
  4: "suspended",
};

const TEACHER_STATUS_MAP: Record<number, string> = {
  1: "studying",
  2: "graduated",
  3: "dropped_out",
  4: "suspended",
};

const STATUS_KEY_TO_ID: Record<string, number> = {
  studying: 1,
  graduated: 2,
  dropped_out: 3,
  suspended: 4,
};

function normalizeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "更新失敗";
}

function extractSchoolName(value: unknown) {
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name : null;
  }

  return null;
}

async function fetchUserInfo(userId: string) {
  const result = await supabase
    .from("user_info")
    .select("id, name, identity_id")
    .eq("id", userId)
    .single();

  return {
    data: result.data as UserInfoRow | null,
    error: result.error,
  };
}

async function fetchStudentEducation(studentId: string) {
  const { data, error } = await supabase
    .from("student_education")
    .select(
      `
      id,
      status_id,
      department,
      degree_level,
      schools ( name )
    `
    )
    .eq("student_id", studentId)
    .maybeSingle();

  return {
    data: data
      ? {
          id: data.id,
          department: data.department,
          degreeLevel: data.degree_level,
          statusId: data.status_id,
          schoolName: extractSchoolName(data.schools),
        }
      : null,
    error,
  };
}

async function fetchTeacherEducation(teacherId: string) {
  const { data, error } = await supabase
    .from("teacher_education")
    .select(
      `
      id,
      status_id,
      department,
      degree_level,
      schools ( name )
    `
    )
    .eq("teacher_id", teacherId)
    .maybeSingle();

  return {
    data: data
      ? {
          id: data.id,
          department: data.department,
          degreeLevel: data.degree_level,
          statusId: data.status_id,
          schoolName: extractSchoolName(data.schools),
        }
      : null,
    error,
  };
}

async function ensureSchoolId(name: string) {
  const { data, error } = await supabase.rpc("ensure_school", {
    p_name: name,
  });

  return {
    schoolId: data,
    error,
  };
}

export function useOnboardingController() {
  const router = useRouter();
  const { showModal } = useModal();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [identityId, setIdentityId] = useState<number | null>(null);
  const [school, setSchool] = useState("");
  const [status, setStatus] = useState("studying");
  const [department, setDepartment] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("bachelor");

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const user = await authService.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data: userInfo, error: userInfoError } = await fetchUserInfo(
          user.id
        );

        if (userInfoError || !userInfo) {
          throw userInfoError ?? new Error("無法載入使用者資料");
        }

        if (!isMounted) {
          return;
        }

        setFullName(userInfo.name ?? "");
        setIdentityId(userInfo.identity_id);

        if (userInfo.identity_id === 1) {
          const { error: adminUpdateError } = await supabase
            .from("user_info")
            .update({ is_first_login: true })
            .eq("id", user.id);

          if (adminUpdateError) {
            console.error("Error updating first login for admin:", adminUpdateError);
          }

          router.push("/admin/dashboard");
          return;
        }

        let educationSummary: EducationSummary | null = null;

        if (userInfo.identity_id === 3) {
          const { data } = await fetchStudentEducation(user.id);
          educationSummary = data;
        }

        if (userInfo.identity_id === 2) {
          const { data } = await fetchTeacherEducation(user.id);
          educationSummary = data;
        }

        if (educationSummary) {
          setSchool(educationSummary.schoolName ?? "");
          setDepartment(educationSummary.department ?? "");
          setDegreeLevel(educationSummary.degreeLevel ?? "bachelor");

          const statusMap =
            userInfo.identity_id === 2 ? TEACHER_STATUS_MAP : STUDENT_STATUS_MAP;
          setStatus(statusMap[educationSummary.statusId] ?? "studying");
        }
      } catch (initializeError) {
        console.error(initializeError);
        if (isMounted) {
          setError(normalizeErrorMessage(initializeError));
        }
      } finally {
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!fullName.trim()) {
        throw new Error("請輸入姓名");
      }

      const user = await authService.getUser();
      if (!user) {
        throw new Error("未登入");
      }

      let schoolId: string | null = null;

      if (school.trim()) {
        const { schoolId: ensuredSchoolId, error: ensureSchoolError } =
          await ensureSchoolId(school.trim());

        if (ensureSchoolError) {
          console.error("School Sync Error:", ensureSchoolError);
          throw new Error("學校資料同步失敗");
        }

        schoolId = ensuredSchoolId;
      }

      const { error: updateUserError } = await supabase
        .from("user_info")
        .update({ name: fullName.trim() })
        .eq("id", user.id);

      if (updateUserError) {
        throw updateUserError;
      }

      const statusId = STATUS_KEY_TO_ID[status] ?? 1;

      if (identityId === 3 && schoolId) {
        const { data: existingEducation } = await supabase
          .from("student_education")
          .select("id")
          .eq("student_id", user.id)
          .maybeSingle();

        const studentEducationPayload = {
          school_id: schoolId,
          status_id: statusId,
          department,
          degree_level: degreeLevel,
        };

        const studentEducationQuery = existingEducation
          ? supabase
              .from("student_education")
              .update(studentEducationPayload)
              .eq("id", existingEducation.id)
          : supabase.from("student_education").insert({
              student_id: user.id,
              ...studentEducationPayload,
            });

        const { error: studentEducationError } = await studentEducationQuery;

        if (studentEducationError) {
          throw new Error("學歷資料更新失敗");
        }
      }

      if (identityId === 2 && schoolId) {
        const { data: existingEducation } = await supabase
          .from("teacher_education")
          .select("id")
          .eq("teacher_id", user.id)
          .maybeSingle();

        const teacherEducationPayload = {
          school_id: schoolId,
          status_id: statusId,
          department,
          degree_level: degreeLevel,
        };

        const teacherEducationQuery = existingEducation
          ? supabase
              .from("teacher_education")
              .update(teacherEducationPayload)
              .eq("id", existingEducation.id)
          : supabase.from("teacher_education").insert({
              teacher_id: user.id,
              ...teacherEducationPayload,
            });

        const { error: teacherEducationError } = await teacherEducationQuery;

        if (teacherEducationError) {
          throw new Error("學歷資料更新失敗");
        }
      }

      const { error: firstLoginError } = await supabase
        .from("user_info")
        .update({ is_first_login: true })
        .eq("id", user.id);

      if (firstLoginError) {
        console.error("Error updating first login status:", firstLoginError);
      }

      showModal({
        title: "資料更新成功",
        description: "您的個人資料已儲存。",
        confirmText: "進入儀表板",
        onConfirm: () => {
          if (identityId === 1) {
            router.push("/admin/dashboard");
            return;
          }

          if (identityId === 2) {
            router.push("/teacher/dashboard");
            return;
          }

          if (identityId === 3) {
            router.push("/student/dashboard");
            return;
          }

          void authService.signOut();
          router.push("/auth/login");
        },
      });
    } catch (submitError) {
      console.error(submitError);
      setError(normalizeErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  return {
    pageLoading,
    form: {
      loading,
      error,
      fullName,
      setFullName,
      school,
      setSchool,
      status,
      setStatus,
      department,
      setDepartment,
      degreeLevel,
      setDegreeLevel,
      onSubmit: handleSubmit,
    },
  };
}
