"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Portfolio } from "@/lib/domain/portfolio/entity";
import Footer from "@/components/Footer";
import { Modal } from "@/components/ui/Modal";

type TeacherInfo = {
    id: string;
    name: string | null;
    avatar_url: string | null;
    title: string | null;
    bio: string | null;
    email?: string | null;
    phone?: string | null;
};

type PortfolioWithCategory = Portfolio & {
    category?: string | null;
};

const categoryColors: Record<string, { bg: string; text: string }> = {
    陶藝: { bg: "bg-primary/10", text: "text-primary" },
    繪畫: { bg: "bg-orange-500/10", text: "text-orange-500" },
    刺繡: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
    金工: { bg: "bg-purple-500/10", text: "text-purple-500" },
    創作: { bg: "bg-primary/10", text: "text-primary" },
};

function getCategoryStyle(category: string | null | undefined) {
    if (!category) return { bg: "bg-gray-100", text: "text-gray-600" };
    return categoryColors[category] || { bg: "bg-gray-100", text: "text-gray-600" };
}

export default function TeacherPortfolioGalleryPage() {
    const params = useParams();
    const teacherCode = useMemo(
        () => (params?.teacherCode as string)?.trim() || "",
        [params]
    );

    const [loading, setLoading] = useState(true);
    const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
    const [portfolios, setPortfolios] = useState<PortfolioWithCategory[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConsultOpen, setIsConsultOpen] = useState(false);

    useEffect(() => {
        if (!teacherCode) {
            setError("請提供教師代碼");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            // Fetch teacher info
            const { data: teacherData, error: teacherError } = await supabase.rpc(
                "get_public_teacher_profile",
                { code: teacherCode }
            );

            if (teacherError || !teacherData) {
                setError("找不到教師資料");
                setLoading(false);
                return;
            }

            const teacherResult = Array.isArray(teacherData)
                ? teacherData[0]
                : teacherData;

            if (!teacherResult) {
                setError("找不到教師資料");
                setLoading(false);
                return;
            }

            setTeacher({
                id: teacherResult.teacher_code,
                name: teacherResult.name,
                avatar_url: teacherResult.avatar_url,
                title: teacherResult.title,
                bio: teacherResult.bio,
            });

            // Fetch all published portfolios
            const { data: portfolioData } = await supabase
                .from("portfolios")
                .select("*, teacher_info!inner(teacher_code)")
                .eq("teacher_info.teacher_code", teacherCode)
                .eq("status", "published")
                .order("created_at", { ascending: false });

            if (portfolioData) {
                setPortfolios(portfolioData as PortfolioWithCategory[]);

                // Extract unique categories
                const uniqueCategories = [
                    ...new Set(
                        portfolioData
                            .map((p: any) => p.category)
                            .filter((c: string | null) => c != null)
                    ),
                ] as string[];
                setCategories(uniqueCategories);
            }

            setLoading(false);
        };

        fetchData();
    }, [teacherCode]);

    const filteredPortfolios = useMemo(() => {
        if (!selectedCategory) return portfolios;
        return portfolios.filter((p) => p.category === selectedCategory);
    }, [portfolios, selectedCategory]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">載入中...</p>
                </div>
            </div>
        );
    }

    if (error || !teacher) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="max-w-md rounded-2xl bg-white dark:bg-[#15262d] p-8 text-center shadow-lg">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {error || "找不到資料"}
                    </h1>
                    <Link
                        href="/teachers"
                        className="mt-6 inline-block text-primary hover:underline text-sm"
                    >
                        返回教師列表
                    </Link>
                </div>
            </div>
        );
    }

    const name = teacher.name || "未命名老師";
    const avatarUrl =
        teacher.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EEF2FF&color=1F2937&size=500`;

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-[#111618] dark:text-white transition-colors duration-300 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#101d22]/80 backdrop-blur-lg transition-all">
                <div className="mx-auto flex h-20 max-w-[1024px] items-center justify-between px-6 sm:px-10">
                    <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110">
                            <Image
                                src="/logo.svg"
                                alt="TimeCarve Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h2 className="text-xl font-bold leading-tight tracking-tight text-[#111618] dark:text-white">
                            TimeCarve 刻時
                        </h2>
                    </Link>


                    <button className="md:hidden flex items-center justify-center text-[#111618] dark:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1080px] mx-auto px-4 py-12 flex-1">
                {/* Teacher Profile Header */}
                <div className="flex flex-col items-center mb-16">
                    <div className="relative group mb-6">
                        <div className="size-36 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                            <Image
                                alt={name}
                                className="w-full h-full object-cover"
                                src={avatarUrl}
                                width={144}
                                height={144}
                            />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-primary text-white size-9 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800">
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                        </div>
                    </div>
                    <div className="text-center space-y-3">
                        <h2 className="text-4xl font-bold tracking-tight text-[#111618] dark:text-white">
                            {name}
                        </h2>
                        <p className="text-primary text-lg font-medium">
                            {teacher.title || "專業講師"}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
                            {teacher.bio || "這位老師尚未填寫簡介。"}
                        </p>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <Link
                            href={`/teachers/${teacherCode}`}
                            className="flex items-center gap-2 bg-primary text-white px-10 py-3.5 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined">person</span>
                            教師個人頁
                        </Link>
                        <button
                            onClick={() => setIsConsultOpen(true)}
                            className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 px-8 py-3.5 rounded-full font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                            <span className="material-symbols-outlined">mail</span>
                            諮詢導師
                        </button>
                    </div>
                </div>

                {/* Portfolio Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-100 dark:border-gray-800 pb-6">
                    <h3 className="text-2xl font-bold text-[#111618] dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-3xl">
                            gallery_thumbnail
                        </span>
                        作品展示集
                    </h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`flex-none px-5 py-2 rounded-full text-sm font-semibold transition-colors ${selectedCategory === null
                                ? "bg-primary text-white"
                                : "bg-[#f0f3f4] dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                        >
                            全部作品
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex-none px-5 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat
                                    ? "bg-primary text-white"
                                    : "bg-[#f0f3f4] dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Portfolio Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPortfolios.length > 0 ? (
                        filteredPortfolios.map((portfolio) => {
                            const catStyle = getCategoryStyle(portfolio.category);
                            return (
                                <Link
                                    key={portfolio.id}
                                    href={`/portfolio/${portfolio.id}`}
                                    className="portfolio-card group cursor-pointer"
                                >
                                    <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4 shadow-md bg-gray-100">
                                        {portfolio.cover_image_url ? (
                                            <Image
                                                alt={portfolio.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                src={portfolio.cover_image_url}
                                                fill
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-400">
                                                <span className="material-symbols-outlined text-5xl">image</span>
                                            </div>
                                        )}
                                        <div className="hover-overlay absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="bg-white/95 text-[#111618] px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                                                探索作品
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-[#111618] dark:text-white text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                                                {portfolio.title}
                                            </h4>
                                            {portfolio.category && (
                                                <span
                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${catStyle.bg} ${catStyle.text}`}
                                                >
                                                    {portfolio.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                                            {portfolio.description || "暫無描述"}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center text-gray-500 dark:text-gray-400">
                            <span className="material-symbols-outlined text-5xl mb-4 block">
                                inventory_2
                            </span>
                            <p>目前沒有作品</p>
                        </div>
                    )}
                </div>

                {/* Footer Text */}
                {filteredPortfolios.length > 0 && (
                    <div className="mt-20 flex flex-col items-center text-center">
                        <div className="w-20 h-px bg-gray-200 dark:bg-gray-800 mb-8"></div>
                        <p className="text-gray-400 dark:text-gray-500 text-sm italic font-light">
                            探索更多 {name} 的藝術創作時光
                        </p>
                    </div>
                )}
            </main>

            {/* Floating CTA */}
            {/* Floating CTA removed */}

            <Modal
                isOpen={isConsultOpen}
                onClose={() => setIsConsultOpen(false)}
                title="諮詢老師"
                description="以下是老師的聯絡方式"
                confirmText="關閉"
            >
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
                        <span className="text-slate-500">Email</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {teacher.email || "尚未提供"}
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
                        <span className="text-slate-500">電話</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {teacher.phone || "尚未提供"}
                        </span>
                    </div>
                </div>
            </Modal>

            <Footer />

            <style jsx>{`
        .portfolio-card:hover .hover-overlay {
          opacity: 1;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}
