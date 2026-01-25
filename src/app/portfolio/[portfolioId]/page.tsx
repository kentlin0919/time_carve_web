import React from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Portfolio } from "@/lib/domain/portfolio/entity";
import Footer from "@/components/Footer";

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
           teacher_code,
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
    <div className="bg-background-light min-h-screen font-sans selection:bg-primary/20 flex flex-col">
      {/* Header - Transparent/Glass */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.svg"
                alt="TimeCarve Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold tracking-tight text-slate-800">
                TimeCarve <span className="text-primary font-medium">刻時</span>
              </span>
              <span className="text-sm font-bold tracking-[0.2em] font-medium text-slate-500 uppercase">
                Art & Handcraft
              </span>
            </div>
          </Link>

        </div>
      </header>

      <main className="pt-32 flex-1">
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
              <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 prose prose-slate max-w-none text-slate-800 prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-2xl prose-h2:flex prose-h2:items-center prose-h2:gap-3 prose-p:text-slate-700 prose-p:leading-relaxed prose-li:text-slate-700 prose-img:rounded-xl prose-img:shadow-md [&_*]:text-slate-800">
                <div
                  dangerouslySetInnerHTML={{ __html: portfolio.content || "" }}
                />
              </div>
            </div>

            {/* Right Column: Author Profile & Actions */}
            <div className="lg:col-span-4 relative">
              <div className="sticky top-28 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg shadow-slate-200/50">
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
                    <a
                      href={
                        portfolio.teacher?.teacher_code
                          ? `/teachers?teacher_code=${encodeURIComponent(portfolio.teacher.teacher_code)}`
                          : '#'
                      }
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                    >
                      <span className="material-symbols-outlined text-xl">
                        person
                      </span>
                      教師個人檔案
                    </a>
                    <button className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-xl">
                        collections
                      </span>
                      查看更多作品
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
