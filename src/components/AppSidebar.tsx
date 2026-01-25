"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AppSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<
    "student" | "teacher" | "admin" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  useEffect(() => {
    const checkUserRole = async () => {
      // const supabase = createClient(); // uses imported supabase instance
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Simple role check based on metadata or you could fetch from DB
        // For now, let's infer from the URL or local storage if needed,
        // but robustly we should probably check the path or a context.
        // Given existing code uses "AuthGuard", let's assume path segments imply role for navigation context
        if (pathname.startsWith("/teacher")) {
          setUserRole("teacher");
        } else if (pathname.startsWith("/student")) {
          setUserRole("student");
        } else if (pathname.startsWith("/admin")) {
          setUserRole("admin");
        } else {
          // Default or guest
          setUserRole(null);
        }

        // Fetch User Info
        const { data: uInfo } = await supabase
          .from("user_info")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (uInfo) {
          setUserInfo(uInfo);
        }

        // Fetch Student Info if role is student or implied
        if (pathname.startsWith("/student")) {
          const { data: sInfo } = await supabase
            .from("student_info")
            .select("student_code")
            .eq("id", user.id)
            .maybeSingle();
          if (sInfo) setStudentInfo(sInfo);
        }
      }
      setLoading(false);
    };

    checkUserRole();
  }, [pathname]);

  // Navigation Items Config
  const getNavItems = () => {
    if (userRole === "student") {
      return [
        { name: "儀表板", href: "/student/dashboard", icon: "dashboard" },
        { name: "課程方案", href: "/student/courses", icon: "menu_book" }, // Updated href guess
        { name: "預約記錄", href: "/student/bookings", icon: "calendar_month" }, // Updated href guess
        { name: "學習進度", href: "/student/progress", icon: "trending_up" }, // Updated href guess
        { name: "個人設定", href: "/student/profile", icon: "settings" }, // Updated href guess
      ];
    } else if (userRole === "teacher") {
      return [
        { name: "儀表板", href: "/teacher/dashboard", icon: "dashboard" },
        { name: "課程管理", href: "/teacher/courses", icon: "edit_note" },
        { name: "預約管理", href: "/teacher/bookings", icon: "calendar_today" },
        { name: "學生列表", href: "/teacher/students", icon: "groups" },
        { name: "作品集", href: "/teacher/portfolio", icon: "photo_library" },
        { name: "報表", href: "/teacher/reports", icon: "bar_chart" },
        { name: "設定", href: "/teacher/settings", icon: "settings" },
      ];
    } else {
      // Public / Guest
      return [
        { name: "首頁", href: "/", icon: "home" },
        { name: "課程瀏覽", href: "/courses", icon: "school" },
        { name: "師資介紹", href: "/teachers", icon: "group" },
        { name: "登入 /註冊", href: "/auth/login", icon: "login" },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-gray-800 
          border-r border-slate-200 dark:border-slate-800 
          z-30 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full p-6">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10 text-teal-600 dark:text-teal-400">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.svg"
                alt="TimeCarve Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
              TimeCarve 刻時
            </span>
            <button
              onClick={onClose}
              className="md:hidden ml-auto p-1 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-4">
              主選單 (
              {userRole === "student"
                ? "學生"
                : userRole === "teacher"
                  ? "教師"
                  : "訪客"}
              )
            </div>

            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()} // Close on mobile click
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden
                    ${isActive
                      ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 rounded-r-full"></div>
                  )}
                  <span
                    className={`material-symbols-outlined text-[22px] ${!isActive && "group-hover:scale-110 transition-transform"
                      }`}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Action (Logout or Login) */}
          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            {userRole ? (
              <div
                onClick={handleLogout}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all group"
              >
                <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-10 w-10 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {userInfo?.name || "使用者"}
                  </span>
                  <span className="text-xs text-slate-500 truncate capitalize">
                    {userRole === "student" && studentInfo?.student_code
                      ? studentInfo.student_code
                      : userRole}
                  </span>
                </div>
                <span className="material-symbols-outlined text-slate-400 ml-auto group-hover:text-red-500 transition-colors">
                  logout
                </span>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-teal-50 hover:text-teal-600 transition-all text-slate-600"
              >
                <span className="material-symbols-outlined">login</span>
                <span className="text-sm font-bold">登入</span>
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
