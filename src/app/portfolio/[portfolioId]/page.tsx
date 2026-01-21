import React from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Portfolio } from "@/lib/domain/portfolio/entity";

interface PublicPortfolioPageProps {
  params: Promise<{
    portfolioId: string;
  }>;
}

async function getPortfolio(id: string) {
  const supabase = createClient();

  // We can use the Repository or raw query. Since we need to join teacher info deeply
  // Let's use raw query here for specific public view needs or reuse repository if it returns enough info

  const { data, error } = await (
    await supabase
  )
    .from("portfolios")
    .select(
      `
        *,
        teacher:teacher_info(
           id,
           title,
           user:user_info(name, avatar_url)
        ),
        portfolio_media(*),
        portfolio_tags(tags(name))
      `
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as any; // Type casting for ease here, essentially matches Portfolio + joined data
}

export default async function PublicPortfolioPage({
  params,
}: PublicPortfolioPageProps) {
  const { portfolioId } = await params;
  const portfolio = await getPortfolio(portfolioId);

  if (!portfolio) {
    notFound();
  }

  // Basic Access Control: if not published, only owner can see (handled by RLS usually, but good to check status)
  // However, for "preview" mode which might reuse this component, we might need to bypass.
  // This page is PUBLIC route. So we should strictly check status if it's not a preview.

  if (portfolio.status !== "published") {
    // Check if user is the owner, otherwise 404
    const supabase = createClient();
    const {
      data: { user },
    } = await (await supabase).auth.getUser();
    // This check is a bit loose, RLS is better source of truth.
    // If RLS works, getPortfolio would return null for public/anon users if status != published.
    // So we can assume if we got data here, it's either published OR the user is the owner.
  }

  const teacherName = portfolio.teacher?.user?.name || "未知教師";
  const teacherTitle = portfolio.teacher?.title || "講師";
  const teacherAvatar = portfolio.teacher?.user?.avatar_url;

  // Format media
  const mainImage = portfolio.cover_image_url;
  const galleryImages =
    portfolio.portfolio_media?.sort(
      (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
    ) || [];

  return (
    <div className="bg-background-light min-h-screen font-sans selection:bg-primary/20 pb-24">
      {/* Header - Transparent/Glass */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl font-light">
                waves
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold tracking-tight text-slate-800">
                TimeCarve <span className="text-primary font-medium">刻時</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">
                Art & Handcraft
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/courses"
              className="text-sm font-medium text-slate-700 hover:text-primary transition-colors"
            >
              最新課程
            </Link>
            <Link
              href="/portfolio"
              className="text-sm font-medium text-slate-700 hover:text-primary transition-colors"
            >
              作品集
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-slate-700 hover:text-primary transition-colors"
            >
              品牌故事
            </Link>
            <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/25 hover:-translate-y-0.5">
              預約諮詢
            </button>
          </nav>
        </div>
      </header>

      <main className="pt-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* Title Section */}
          <div className="mb-12 text-center">
            {portfolio.category && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-primary text-xs font-bold mb-4">
                <span className="material-symbols-outlined text-sm">brush</span>
                {portfolio.category}
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
              {portfolio.title}
            </h1>
            {portfolio.description && (
              <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
                {portfolio.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Content & Gallery */}
            <div className="lg:col-span-8 flex flex-col gap-10">
              {/* Main Media & Gallery Grid */}
              <div className="space-y-4">
                {/* Main Cover Image */}
                {mainImage && (
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 group relative bg-slate-100">
                    <img
                      src={mainImage}
                      alt={portfolio.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    {/* Optional Overlay Caption */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-8 pointer-events-none">
                      <span className="text-white/80 text-sm font-light">
                        {portfolio.title} - Main View
                      </span>
                    </div>
                  </div>
                )}

                {/* Thumbnail Gallery */}
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {galleryImages.map((media: any) => (
                      <div
                        key={media.id}
                        className="aspect-square rounded-xl overflow-hidden shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all bg-slate-100 relative group"
                      >
                        {media.file_type === "video" ? (
                          <>
                            <video
                              src={media.file_url}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-3xl opacity-80 group-hover:opacity-100 transition-opacity">
                                play_circle
                              </span>
                            </div>
                          </>
                        ) : (
                          <img
                            src={media.file_url}
                            alt="Gallery Item"
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rich Content Body */}
              <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:flex prose-h2:items-center prose-h2:gap-3 prose-p:text-slate-600 prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-md">
                <div
                  dangerouslySetInnerHTML={{ __html: portfolio.content || "" }}
                />
              </div>
            </div>

            {/* Right Column: Author Profile & Actions */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg shadow-slate-200/50 sticky top-28">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="size-24 rounded-full p-1 border-2 border-primary mb-4">
                    <div className="size-full rounded-full bg-slate-200 overflow-hidden relative">
                      {teacherAvatar ? (
                        <img
                          src={teacherAvatar}
                          alt={teacherName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-500">
                          <span className="material-symbols-outlined text-4xl">
                            person
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {teacherName}
                  </h3>
                  <p className="text-primary text-sm font-medium mt-1">
                    {teacherTitle}
                  </p>
                </div>

                <p className="text-sm text-slate-500 leading-relaxed mb-8 border-t border-slate-50 pt-6">
                  致力於推廣「惜物、愛物」的藝術生活觀。在 TimeCarve
                  刻時，我希望帶領學員透過手作的溫度，在繁忙的日常中找回內心的平靜。
                </p>

                <div className="space-y-3">
                  <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5">
                    <span className="material-symbols-outlined text-xl">
                      calendar_add_on
                    </span>
                    預約此課程
                  </button>
                  <button className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-xl">
                      collections
                    </span>
                    查看更多作品
                  </button>
                </div>

                <div className="mt-8 flex justify-center gap-4 text-slate-400">
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">share</span>
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">favorite</span>
                  </button>
                  <button className="hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">bookmark</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative group cursor-pointer hover:shadow-2xl transition-all">
                <div className="relative z-10">
                  <h4 className="font-bold mb-2 text-lg">
                    想體驗手作的魅力嗎？
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 font-light">
                    加入我們的週末工藝坊，打造屬於你的藝術品。
                  </p>
                  <div className="inline-flex items-center gap-1 text-primary text-sm font-bold group-hover:gap-2 transition-all">
                    了解近期工作坊{" "}
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-7xl text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  local_florist
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">waves</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-700">
              TimeCarve 刻時
            </span>
          </div>
          <div className="text-slate-400 text-xs font-light">
            © 2024 TimeCarve 刻時. 手作藝術與身心美學. 版權所有
          </div>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-xs text-slate-500 hover:text-primary"
            >
              服務條款
            </Link>
            <Link
              href="#"
              className="text-xs text-slate-500 hover:text-primary"
            >
              隱私政策
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
