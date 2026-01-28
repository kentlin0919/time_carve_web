import React from "react";
import PublicPortfolioPage from "@/app/portfolio/[portfolioId]/page";
import Link from "next/link";

interface PreviewPageProps {
  params: Promise<{
    portfolioId: string;
  }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { portfolioId } = await params;

  return (
    <>
      {/* Preview Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full px-6">
          <span className="material-symbols-outlined">visibility</span>
          <span className="font-bold">預覽模式</span>
          <span className="text-sm opacity-90 hidden sm:inline">
            {" "}
            | 這是在公開發布前的預覽畫面
          </span>
        </div>
        <div className="flex gap-4 pr-6">
          <Link
            href={`/teacher/portfolio/${portfolioId}`}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-bold transition-colors"
          >
            返回編輯
          </Link>
        </div>
      </div>

      {/* Reusing the public page component */}
      <div className="pt-10 pointer-events-none opacity-50 relative">
        {/* We wrap it to add some visual cue or just render it directly */}
      </div>

      {/* 
         Since PublicPortfolioPage is an async server component, we can just render it.
         However, sticking strictly to "reusing components" in Next.js App Router for full pages 
         can be tricky if they have internal data fetching constraints.
         
         But since PublicPortfolioPage takes `params`, we can just call it.
         Note: The layout of the public page might have fixed headers that need adjustment for the banner.
      */}
      <div className="preview-wrapper">
        <PublicPortfolioPage params={params} />
      </div>

      <style>{`
        .preview-wrapper header {
            top: 52px !important; /* Offset for banner */
        }
      `}</style>
    </>
  );
}
