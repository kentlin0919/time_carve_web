import React from "react";
import PortfolioListView from "./PortfolioListView";
import { getTeacherPortfolios } from "@/app/actions/portfolio";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PortfolioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch teacher ID
  // In a real app, this might be cached or in a session, but here we query
  const { data: teacher } = await (await supabase)
    .from("teacher_info")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!teacher) {
    // Handle case where user is not a teacher or teacher profile not created
    return (
      <div className="p-8">
        Teacher profile not found. Please complete your profile first.
      </div>
    );
  }

  const portfolios = await getTeacherPortfolios(teacher.id);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background-light dark:bg-background-dark overflow-hidden">
      <PortfolioListView portfolios={portfolios} />
    </div>
  );
}
