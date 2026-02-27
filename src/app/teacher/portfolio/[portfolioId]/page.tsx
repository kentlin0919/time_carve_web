import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPortfolioById } from "@/app/actions/portfolio";
import PortfolioEditForm from "./PortfolioEditForm";

interface PageProps {
  params: Promise<{
    portfolioId: string;
  }>;
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { portfolioId } = await params;
  const isCreating = portfolioId === "new";

  const supabase = createClient();
  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch teacher ID
  const { data: teacher } = await (await supabase)
    .from("teacher_info")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!teacher) {
    return <div>Teacher profile not found.</div>;
  }

  let portfolioData = null;

  if (!isCreating) {
    portfolioData = await getPortfolioById(portfolioId);

    if (!portfolioData) {
      return <div>Portfolio not found</div>;
    }

    // Ensure ownership
    if (portfolioData.teacher_id !== teacher.id) {
      return <div>Unauthorized access</div>;
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
        <PortfolioEditForm
          initialData={portfolioData || undefined}
          teacherId={teacher.id}
          isCreating={isCreating}
        />
      </div>
    </div>
  );
}
