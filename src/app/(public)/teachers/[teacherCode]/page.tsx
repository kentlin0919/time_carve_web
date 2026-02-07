"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Portfolio } from "@/lib/domain/portfolio/entity";
import { Course } from "@/lib/domain/course/entity";
import { SupabaseCourseRepository } from "@/lib/infrastructure/course/SupabaseCourseRepository";

type PublicTeacherProfile = {
    teacher_code: string;
    name: string | null;
    avatar_url: string | null;
    title: string | null;
    bio: string | null;
    experience_years: number | null;
    base_price: number | null;
    specialties: string[] | null;
    philosophy_items:
    | {
        title: string;
        description: string;
        icon: string;
    }[]
    | null;
    philosophy_subtitle: string | null;
    educations:
    | {
        school_name: string | null;
        department: string | null;
        degree: string | null;
        degree_level: string | null;
        study_year: number | null;
        start_year: number | null;
        end_year: number | null;
    }[]
    | null;
    experiences:
    | {
        title: string;
        organization: string;
        start_date: string;
        end_date: string | null;
        is_current: boolean;
        description: string | null;
    }[]
    | null;
};

export default function TeacherProfilePage() {
    const params = useParams();
    const teacherCode = useMemo(
        () => (params?.teacherCode as string)?.trim() || "",
        [params]
    );
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<PublicTeacherProfile | null>(null);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!teacherCode) {
            setProfile(null);
            setError("請提供教師代碼");
            return;
        }

        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase.rpc(
                "get_public_teacher_profile",
                { code: teacherCode }
            );

            if (fetchError) {
                console.error(fetchError);
                setProfile(null);
                setError("找不到公開頁面");
            } else {
                const result = Array.isArray(data)
                    ? data[0]
                    : (data as PublicTeacherProfile | null);
                if (!result) {
                    setProfile(null);
                    setError("找不到公開頁面");
                } else {
                    const profileData = result as PublicTeacherProfile;
                    setProfile(profileData);
                    setError(null);

                    // Fetch courses using teacher_id from another source or by joining
                    // Since RPC only returns some fields, let's find the ID
                    const { data: teacherInfo } = await supabase
                        .from('teacher_info')
                        .select('id')
                        .eq('teacher_code', teacherCode)
                        .single();
                    
                    if (teacherInfo) {
                        const courseRepo = new SupabaseCourseRepository();
                        const teacherCourses = await courseRepo.getTeacherCourses(teacherInfo.id);
                        setCourses(teacherCourses.filter(c => c.isActive));
                    }
                }
            }

            // Fetch portfolios
            const { data: portfolioData } = await supabase
                .from("portfolios")
                .select("*, teacher_info!inner(teacher_code)")
                .eq("teacher_info.teacher_code", teacherCode)
                .eq("status", "published")
                .order("created_at", { ascending: false })
                .limit(6);

            if (portfolioData) {
                setPortfolios(portfolioData as any[]);
            }

            setLoading(false);
        };

        fetchProfile();
    }, [teacherCode]);

    if (loading && !profile) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark text-[#111618] dark:text-[#f0f3f4]">
                <div className="max-w-md rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-[#15262d] p-8 text-center shadow-soft">
                    <h1 className="text-xl font-bold">載入中</h1>
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        正在取得老師資訊...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark text-[#111618] dark:text-[#f0f3f4]">
                <div className="max-w-md rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-[#15262d] p-8 text-center shadow-soft">
                    <h1 className="text-xl font-bold">找不到公開頁面</h1>
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        請確認教師代碼正確，或該老師尚未開啟公開頁面。
                    </p>
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

    const name = profile.name || "未命名老師";
    const title = profile.title || "專業講師";
    const bio =
        profile.bio || "這位老師尚未填寫個人簡介，歡迎透過預約諮詢了解更多。";
    const avatarUrl =
        profile.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name
        )}&background=EEF2FF&color=1F2937&size=500`;
    const specialties = profile.specialties || [];
    const experienceYears = profile.experience_years ?? 0;
    const philosophyItems = profile.philosophy_items || [];
    const hasPhilosophyItems = philosophyItems.length > 0;
    const educations = profile.educations || [];
    const experiences = profile.experiences || [];
    const primaryEducation = educations[0];
    const degreeLabel =
        primaryEducation?.degree_level || primaryEducation?.degree || null;
    const studyYearLabel =
        primaryEducation?.study_year != null
            ? `大學 ${primaryEducation.study_year} 年級`
            : null;
    const educationSummary = primaryEducation
        ? [
            primaryEducation.school_name,
            primaryEducation.department,
            degreeLabel,
            studyYearLabel,
        ]
            .filter(Boolean)
            .join(" · ")
        : null;

    return (
        <div className="relative flex min-h-screen w-full flex-col group/design-root bg-background-light dark:bg-background-dark text-[#111618] dark:text-[#f0f3f4] font-display overflow-x-hidden selection:bg-primary selection:text-white">
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

                    <div className="hidden md:flex items-center gap-4">
                        <button className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-primary px-6 text-white text-sm font-bold shadow-glow hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95">
                            <span className="truncate">預約諮詢</span>
                        </button>
                    </div>
                    <button className="md:hidden flex items-center justify-center text-[#111618] dark:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full flex flex-col items-center">
                <div className="flex flex-col max-w-[1024px] w-full px-6 sm:px-10">
                    <section className="py-12 sm:py-20 relative overflow-visible">
                        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
                            <div className="md:col-span-5 relative group">
                                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 relative z-10 bg-gray-100">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                        style={{ backgroundImage: `url("${avatarUrl}")` }}
                                    ></div>
                                </div>
                                <div className="absolute -top-5 -left-5 w-full h-full border-2 border-primary/20 rounded-2xl -z-0"></div>
                            </div>

                            <div className="md:col-span-7 flex flex-col gap-6 pt-2">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
                                        <span className="material-symbols-outlined text-sm">
                                            verified
                                        </span>
                                        Senior Instructor
                                    </div>
                                    <h1 className="text-4xl sm:text-5xl font-black text-[#111618] dark:text-white tracking-tight mb-2">
                                        {name}
                                    </h1>
                                    <p className="text-xl font-bold text-gray-700 dark:text-gray-300">
                                        {title}
                                    </p>
                                    {educationSummary && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            {educationSummary}
                                        </p>
                                    )}
                                </div>
                                <div className="h-px w-full bg-gray-100 dark:bg-gray-800"></div>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                                    {bio}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {specialties.length > 0 ? (
                                        specialties.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-4 py-1.5 bg-gray-100 dark:bg-[#1a2c32] text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700"
                                            >
                                                #{tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="px-4 py-1.5 bg-gray-100 dark:bg-[#1a2c32] text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700">
                                            #專業技能待補充
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-2 md:grid-cols-2 gap-6 py-10 border-y border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#1a2c32] rounded-2xl">
                            <span className="text-3xl font-black text-primary">
                                {experienceYears}+
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                                年教學經驗
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#1a2c32] rounded-2xl">
                            <span className="text-3xl font-black text-primary">--</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                                指導學生
                            </span>
                        </div>
                    </section>

                    {/* Education & Experience */}
                    {(educations.length > 0 || experiences.length > 0) && (
                        <section className="py-16 sm:py-24 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex flex-col gap-10">
                                <div className="flex flex-col gap-3 max-w-2xl">
                                    <span className="text-primary font-bold tracking-wider text-xs uppercase">
                                        Background
                                    </span>
                                    <h2 className="text-3xl sm:text-4xl font-black text-[#111618] dark:text-white tracking-tight">
                                        學經歷
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 gap-12">
                                    {/* Experience */}
                                    {experiences.length > 0 && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary">
                                                    work
                                                </span>
                                                工作經歷
                                            </h3>
                                            <div className="border-l border-gray-200 dark:border-gray-700 ml-3 pl-8 space-y-8">
                                                {experiences.map((exp, idx) => (
                                                    <div key={idx} className="relative">
                                                        <div className="absolute -left-[39px] top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-white dark:bg-gray-900"></div>
                                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-1">
                                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                                                {exp.title}
                                                            </h4>
                                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                {exp.organization}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-mono">
                                                            {new Date(exp.start_date).getFullYear()}.
                                                            {(new Date(exp.start_date).getMonth() + 1)
                                                                .toString()
                                                                .padStart(2, "0")}{" "}
                                                            -{" "}
                                                            {exp.is_current
                                                                ? "Present"
                                                                : exp.end_date
                                                                    ? `${new Date(exp.end_date).getFullYear()}.${(
                                                                        new Date(exp.end_date).getMonth() + 1
                                                                    )
                                                                        .toString()
                                                                        .padStart(2, "0")}`
                                                                    : ""}
                                                        </div>
                                                        {exp.description && (
                                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                                                {exp.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Education */}
                                    {educations.length > 0 && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary">
                                                    school
                                                </span>
                                                學歷
                                            </h3>
                                            <div className="border-l border-gray-200 dark:border-gray-700 ml-3 pl-8 space-y-8">
                                                {educations.map((edu, idx) => (
                                                    <div key={idx} className="relative">
                                                        <div className="absolute -left-[39px] top-1.5 w-3 h-3 rounded-full border-2 border-primary bg-white dark:bg-gray-900"></div>
                                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-1">
                                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                                                {edu.school_name}
                                                            </h4>
                                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                                {edu.department}{" "}
                                                                {edu.degree_level || edu.degree}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-mono">
                                                            {edu.start_year} - {edu.end_year || "Present"}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {hasPhilosophyItems && (
                        <section className="py-16 sm:py-24" id="philosophy">
                            <div className="flex flex-col gap-10">
                                <div className="flex flex-col gap-3 max-w-2xl">
                                    <span className="text-primary font-bold tracking-wider text-xs uppercase">
                                        Philosophy
                                    </span>
                                    <h2 className="text-3xl sm:text-4xl font-black text-[#111618] dark:text-white tracking-tight">
                                        我的教學理念
                                    </h2>
                                    <p className="text-lg text-gray-500 dark:text-gray-400 font-light">
                                        {profile.philosophy_subtitle || ""}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {philosophyItems.map((item) => (
                                        <div
                                            key={item.title}
                                            className="group flex flex-col gap-5 rounded-2xl bg-white dark:bg-[#1a2c32] p-8 shadow-soft border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20"
                                        >
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                                <span className="material-symbols-outlined text-3xl">
                                                    {item.icon}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-[#111618] dark:text-white mb-3">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="py-16 sm:py-24 border-t border-gray-100 dark:border-gray-800" id="courses">
                        <div className="flex flex-col gap-10">
                            <div className="flex flex-col gap-3 max-w-2xl">
                                <span className="text-primary font-bold tracking-wider text-xs uppercase">
                                    Courses
                                </span>
                                <h2 className="text-3xl sm:text-4xl font-black text-[#111618] dark:text-white tracking-tight">
                                    開設課程
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {courses.length > 0 ? (
                                    courses.map((course) => (
                                        <div 
                                            key={course.id} 
                                            className="group bg-white dark:bg-[#1a2c32] rounded-2xl overflow-hidden shadow-soft border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                        >
                                            <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                {course.imageUrl ? (
                                                    <Image src={course.imageUrl} alt={course.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <span className="material-symbols-outlined text-5xl">school</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4">
                                                    <span className="bg-white/90 dark:bg-black/70 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-primary shadow-sm">
                                                        {course.courseType === 'online' ? '線上' : '實體'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-lg font-bold text-[#111618] dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                                    {course.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-8">
                                                    {course.desc || "暫無描述"}
                                                </p>
                                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-800">
                                                    <span className="text-lg font-black text-primary">
                                                        NT$ {course.price?.toLocaleString()}
                                                    </span>
                                                    <Link 
                                                        href={`/student/booking/create?courseId=${course.id}`}
                                                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-glow"
                                                    >
                                                        預約
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                                        <p>老師目前尚無公開課程。</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section
                        className="py-16 sm:py-24 border-t border-gray-100 dark:border-gray-800"
                        id="portfolio"
                    >
                        <div className="flex items-end justify-between pb-10">
                            <div className="flex flex-col gap-2">
                                <span className="text-primary font-bold tracking-wider text-xs uppercase">
                                    Selected Works
                                </span>
                                <h2 className="text-3xl sm:text-4xl font-black text-[#111618] dark:text-white tracking-tight">
                                    精選作品集
                                </h2>
                            </div>
                            <Link
                                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-gray-600 hover:text-primary hover:bg-primary/5 transition-all text-sm font-bold"
                                href={`/teachers/${teacherCode}/portfolio`}
                            >
                                更多作品
                                <span className="material-symbols-outlined text-lg">
                                    arrow_forward
                                </span>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {portfolios.length > 0 ? (
                                portfolios.map((portfolio) => (
                                    <Link
                                        key={portfolio.id}
                                        className="group cursor-pointer flex flex-col gap-4"
                                        href={`/portfolio/${portfolio.id}`}
                                    >
                                        <div className="relative overflow-hidden rounded-2xl aspect-square bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-lg transition-all duration-500">
                                            {portfolio.cover_image_url ? (
                                                <div
                                                    className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110"
                                                    style={{ backgroundImage: `url("${portfolio.cover_image_url}")` }}
                                                ></div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-400">
                                                    <span className="material-symbols-outlined text-4xl">
                                                        image
                                                    </span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                                <p className="text-white text-sm font-bold">查看詳情</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[#111618] dark:text-white text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                                                {portfolio.title}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                                                {portfolio.description || "暫無描述"}
                                            </p>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                                    <p>這位老師尚未發布作品。</p>
                                </div>
                            )}
                        </div>
                        {portfolios.length > 0 && (
                            <div className="mt-10 text-center sm:hidden">
                                <Link
                                    className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-primary/10 text-primary font-bold"
                                    href={`/teachers/${teacherCode}/portfolio`}
                                >
                                    查看所有作品
                                    <span className="material-symbols-outlined text-lg">
                                        arrow_forward
                                    </span>
                                </Link>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
