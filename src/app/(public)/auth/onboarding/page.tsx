"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { AuthService } from "@/lib/application/auth/AuthService";
import { SupabaseAuthRepository } from "@/lib/infrastructure/auth/SupabaseAuthRepository";
import EducationInputs from "@/components/ui/EducationInputs";
import { useSchools } from "@/hooks/useSchools";
import { useModal } from "@/components/providers/ModalContext";

const authRepository = new SupabaseAuthRepository();
const authService = new AuthService(authRepository);

export default function OnboardingPage() {
  const router = useRouter();
  const { showModal } = useModal();
  const schools = useSchools();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [identityId, setIdentityId] = useState<number | null>(null);

  // Education State
  const [school, setSchool] = useState("");
  const [status, setStatus] = useState("studying");
  const [department, setDepartment] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("bachelor");

  useEffect(() => {
    // Check if logged in
    const checkUser = async () => {
      const user = await authService.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Optional: Check if profile is already complete, if so redirect?
      // For now, let's assume they come here to fill it.
      // We could fetch existing data to pre-fill.

      const { data: userInfo } = await (
        supabase.from("user_info" as any) as any
      )
        .select("name, identity_id")
        .eq("id", user.id)
        .single();

      if (userInfo) {
        if (userInfo.name) setFullName(userInfo.name);

        // Legacy mapping removed in favor of role-specific explicit fetches below
        // if (userInfo.education) { ... }

        if (userInfo.identity_id) {
          setIdentityId(userInfo.identity_id);
          if (userInfo.identity_id === 1) {
            const { error: adminUpdateError } = await supabase
              .from("user_info")
              .update({ is_first_login: true } as any)
              .eq("id", user.id);
            if (adminUpdateError) {
              console.error(
                "Error updating first login for admin:",
                adminUpdateError,
              );
            }
            router.push("/admin/dashboard");
            return;
          }

          // Fetch logic based on role
          if (userInfo.identity_id === 3) {
            // Student: Check student_info (for teacher_code) AND student_education

            // 1. student_info
            const { data: studentInfo } = await supabase
              .from("student_info")
              .select("teacher_code")
              .eq("id", user.id)
              .single();

            if (studentInfo?.teacher_code) {
              setTeacherCode(studentInfo.teacher_code);
            }

            // 2. student_education
            const { data: studentEdu } = await supabase
              .from("student_education")
              .select(
                `
                 school_id,
                 status_id,
                 department,
                 degree_level,
                 schools ( name )
               `,
              )
              .eq("student_id", user.id)
              .maybeSingle();

            if (studentEdu) {
              // Map to form state
              if (studentEdu.schools && (studentEdu.schools as any).name) {
                setSchool((studentEdu.schools as any).name);
              }
              if (studentEdu.department) setDepartment(studentEdu.department);
              if (studentEdu.degree_level) setDegreeLevel(studentEdu.degree_level);

              // Map status_id back to status key
              const STATUS_ID_MAP: Record<number, string> = {
                1: "studying",
                2: "graduated",
                3: "suspended",
                4: "other",
              };
              if (studentEdu.status_id) {
                setStatus(STATUS_ID_MAP[studentEdu.status_id] || "studying");
              }
            }
          } else if (userInfo.identity_id === 2) {
            // Teacher: Check teacher_education
            const { data: teacherEdu } = await supabase
              .from("teacher_education")
              .select(
                `
                 school_id,
                 status_id,
                 department,
                 degree_level,
                 schools ( name )
               `,
              )
              .eq("teacher_id", user.id)
              .maybeSingle();

            if (teacherEdu) {
              // Map to form state
              if (teacherEdu.schools && (teacherEdu.schools as any).name) {
                setSchool((teacherEdu.schools as any).name);
              }
              if (teacherEdu.department) setDepartment(teacherEdu.department);
              if (teacherEdu.degree_level) setDegreeLevel(teacherEdu.degree_level);

              // Map status_id back to status key
              const STATUS_ID_MAP: Record<number, string> = {
                1: "studying",
                2: "graduated",
                3: "dropped_out",
                4: "suspended",
              };
              if (teacherEdu.status_id) {
                setStatus(STATUS_ID_MAP[teacherEdu.status_id] || "studying");
              }
            }
          }
        }
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!fullName.trim()) throw new Error("請輸入姓名");

      // Teacher code validtion removed (moved to registration)

      const user = await authService.getUser();
      if (!user) throw new Error("未登入");

      // 1. Ensure School Exists & Get ID
      let schoolId: string | null = null;
      if (school) {
        // Find if we have a code from our list
        const matchedSchool = schools.find((s) => s.name === school);
        const codeToUse = matchedSchool?.code || null;

        const { data: sId, error: schoolError } = await supabase.rpc(
          "ensure_school" as any,
          {
            p_name: school,
            p_code: codeToUse,
          },
        );

        if (schoolError) {
          console.error("School Sync Error:", schoolError);
          throw new Error("學校資料同步失敗");
        }
        schoolId = sId;
      }

      // 2. Update user_info (profile basic info)
      // Remove teacher_code from here as it belongs to student_info
      const { error: updateError } = await supabase
        .from("user_info")
        .update({
          name: fullName,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("User Info Update Error:", updateError);
        throw updateError;
      }

      if (identityId === 3) {
        // ... (student logic unchanged)
        // Teacher code update logic removed (handled at registration)

        // 3b. Update student_education
        if (schoolId) {
          const STATUS_MAP: Record<string, number> = {
            studying: 1,
            graduated: 2,
            dropped_out: 3,
            suspended: 4,
          };
          const statusId = STATUS_MAP[status] || 1;

          // Check for existing education record to avoid duplicates
          const { data: existingEdu } = await supabase
            .from("student_education")
            .select("id")
            .eq("student_id", user.id)
            .maybeSingle();

          let eduError;

          if (existingEdu) {
            const { error } = await supabase
              .from("student_education")
              .update({
                school_id: schoolId,
                status_id: statusId,
                department: department,
                degree_level: degreeLevel,
              })
              .eq("id", existingEdu.id);
            eduError = error;
          } else {
            const { error } = await supabase.from("student_education").insert({
              student_id: user.id,
              school_id: schoolId,
              status_id: statusId,
              department: department,
              degree_level: degreeLevel,
            });
            eduError = error;
          }

          if (eduError) {
            console.error("Education Update Error:", eduError);
            throw new Error("學歷資料更新失敗");
          }
        }
      }

      // 4. Update teacher records (if teacher)
      if (identityId === 2 && schoolId) {
        const STATUS_MAP: Record<string, number> = {
          studying: 1,
          graduated: 2,
          dropped_out: 3,
          suspended: 4,
        };
        const statusId = STATUS_MAP[status] || 1;

        // Check for existing record
        const { data: existingEdu } = await supabase
          .from("teacher_education")
          .select("id")
          .eq("teacher_id", user.id)
          .maybeSingle();

        let eduError;
        if (existingEdu) {
          const { error } = await supabase
            .from("teacher_education")
            .update({
              school_id: schoolId,
              status_id: statusId,
              department: department,
              degree_level: degreeLevel,
            })
            .eq("id", existingEdu.id);
          eduError = error;
        } else {
          const { error } = await supabase.from("teacher_education").insert({
            teacher_id: user.id,
            school_id: schoolId,
            status_id: statusId,
            department: department,
            degree_level: degreeLevel,
          });
          eduError = error;
        }

        if (eduError) {
          console.error("Teacher Education Update Error:", eduError);
          throw new Error("學歷資料更新失敗");
        }
      }

      // 6. Update is_first_login to false
      const { error: isFirstLoginUpdateError } = await supabase
        .from("user_info")
        .update({ is_first_login: true } as any)
        .eq("id", user.id);

      if (isFirstLoginUpdateError) {
        console.error(
          "Error updating first login status:",
          isFirstLoginUpdateError,
        );
        // We continue anyway since data is saved
      }

      showModal({
        title: "資料更新成功",
        description: "您的個人資料已儲存。",
        confirmText: "進入儀表板",
        onConfirm: () => {
          if (identityId === 1) {
            router.push("/admin/dashboard");
          } else if (identityId === 2) {
            router.push("/teacher/dashboard");
          } else if (identityId === 3) {
            router.push("/student/dashboard");
          } else {
            // unknown identityId logout
            authService.signOut();
            router.push("/auth/login");
          }
        },
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-gray-700">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            完善個人資料
          </h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm">
            請幫助我們認識您，以便提供更好的服務
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-gray-300">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full rounded-xl border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all dark:text-white"
              placeholder="您的真實姓名"
            />
          </div>

          {/* Teacher Code input moved to Registration */}

          <div className="space-y-4">
            <EducationInputs
              school={school}
              setSchool={setSchool}
              status={status}
              setStatus={setStatus}
              department={department}
              setDepartment={setDepartment}
              degreeLevel={degreeLevel}
              setDegreeLevel={setDegreeLevel}
              labels={{
                school: "就讀學校",
                status: "就學狀態",
                department: "科系/所",
              }}
              className="gap-4"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "儲存中..." : "儲存並繼續"}
          </button>
        </form>
      </div>
    </div>
  );
}
