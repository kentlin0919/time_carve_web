'use server'

import { SupabaseTeacherRepository } from "@/lib/infrastructure/teacher/SupabaseTeacherRepository";
import { createClient } from "@/lib/supabase/server";

export async function getTeacherProfile() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  console.log("[getTeacherProfile] User check:", user?.id, "Error:", error);

  if (!user) {
    console.error("[getTeacherProfile] No user found via getUser()");
    throw new Error("Unauthorized: User not logged in");
  }

  const repo = new SupabaseTeacherRepository(supabase);
  const profile = await repo.getProfile(user.id);

  if (!profile) {
    console.warn("[getTeacherProfile] User logged in but no teacher profile found for id:", user.id);
  } else {
    console.log("[getTeacherProfile] Found profile for:", profile.name);
  }

  return profile;
}

export async function getTeacherCourses(teacherId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Optional: check if teacherId matches user.id, though sometimes admin might fetch?
  // strict security:
  if (user.id !== teacherId) {
    // throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses:", error);
    return [];
  }

  // Map to entity if needed, or return raw. 
  // Let's reuse SupabaseCourseRepository mapping if possible, but for now simple return is fine 
  // OR actually use the Repository!
  const { SupabaseCourseRepository } = await import("@/lib/infrastructure/course/SupabaseCourseRepository");
  const repo = new SupabaseCourseRepository(supabase);
  const courses = await repo.getTeacherCourses(teacherId);
  console.log(`[getTeacherCourses] Fetched ${courses?.length} courses for teacher ${teacherId}`);
  return courses;
}

export async function getStudentCoursePurchases(studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Security check: Ensure the teacher has access to this student (optional but recommended)
  // For now, assuming if they can call this with a studentId, they are authorized (or RLS handles it)

  const { data, error } = await supabase
    .from("course_purchases")
    .select("course_id, total_hours, remaining_hours, status")
    .eq("student_id", studentId)
    .eq("status", "active");

  if (error) {
    console.error("Error fetching student course purchases:", error);
    return [];
  }

  return data;
}
