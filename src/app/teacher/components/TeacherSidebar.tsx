"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSystemModules } from "@/hooks/useSystemModules";
import { getTeacherPendingBookingCount } from "@/app/actions/booking";

export default function TeacherSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isModuleEnabled } = useSystemModules();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDO6reZcrIx4TpNaoa2cHckBMT5jGOVcSOgCiWFeFHvwR5BhOlm6EzZoO1nDA5jhhdVnLiS3xPcbfPeCVuaPW7x9yyQ1OpilXHhQqZf7s1ilC_fOFoonIf98HRVehAYuVriM8l3I0MrYHIn39RVWEj_4jU-wlh_BemOK4VeRUNedhA-sln2p5816fNCRlBCziM3mk1IHmY1EIx1yw45MJkIcGFi9fz7JcPrVe1C0mU8MYnl7CYlnU1BMQEyHUmuypSHuwydpWLgPOU"
  );
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("user_info")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const { data: teacherData } = await supabase
        .from("teacher_info")
        .select("title, teacher_code")
        .eq("id", user.id)
        .single();

      if (userData) {
        setName(userData.name);
        if ((userData as any).avatar_url)
          setAvatarUrl((userData as any).avatar_url);
      }
      if (teacherData) {
        if ((teacherData as any).title) setTitle((teacherData as any).title);
        if (teacherData.teacher_code) setTeacherCode(teacherData.teacher_code);
      }

      // Fetch pending count
      try {
        const count = await getTeacherPendingBookingCount();
        setPendingCount(count);
      } catch (e) {
        console.error("Failed to fetch pending count", e);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const menuItems = [
    {
      category: "管理中心",
      items: [
        {
          name: "儀表板總覽",
          href: "/teacher/dashboard",
          icon: "dashboard",
          key: "teacher_dashboard",
        },
        {
          name: "預約管理",
          href: "/teacher/bookings",
          icon: "calendar_month",
          badge: pendingCount > 0 ? String(pendingCount) : undefined,
          key: "teacher_bookings",
        },
        {
          name: "課程方案",
          href: "/teacher/courses",
          icon: "school",
          key: "teacher_courses",
        },
        {
          name: "作品集管理",
          href: "/teacher/portfolio",
          icon: "photo_library",
          key: "teacher_portfolio",
        },
        {
          name: "學生資訊",
          href: "/teacher/students",
          icon: "group",
          key: "teacher_students",
        },
        {
          name: "個人檔案",
          href: "/teacher/profile",
          icon: "person",
          key: "teacher_profile",
        },
      ],
    },
    {
      category: "財務與分析",
      items: [
        {
          name: "收款管理",
          href: "/teacher/payments",
          icon: "payments",
          key: "teacher_payments",
        },
        {
          name: "營收報表",
          href: "/teacher/reports",
          icon: "monitoring",
          key: "teacher_reports",
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      <aside
        className={`
        w-72 flex-shrink-0 flex flex-col bg-surface-light dark:bg-surface-dark 
        border-r border-border-light dark:border-border-dark h-full 
        transition-transform duration-300 z-40 shadow-sm
        fixed lg:static top-0 left-0
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-6 flex flex-col h-full justify-between">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 px-1 justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8">
                    <Image
                      src="/logo.svg"
                      alt="TimeCarve Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                    TimeCarve 刻時
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="lg:hidden p-1 text-text-sub hover:text-text-main"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full size-12 shadow-sm ring-2 ring-white dark:ring-slate-700 h-12 w-12 shrink-0"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                ></div>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-slate-900 dark:text-white text-base font-bold truncate">
                    {name || "載入中..."}
                  </h1>
                  <p className="text-text-sub dark:text-gray-400 text-xs truncate">
                    {title || "專業家教導師"}
                  </p>
                  {teacherCode && (
                    <p className="text-primary text-[10px] font-mono mt-0.5 truncate bg-primary/10 px-1.5 py-0.5 rounded w-fit">
                      #{teacherCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5 overflow-y-auto">
              {menuItems.map((category, idx) => {
                // Filter items based on modules
                const visibleItems = category.items.filter((item) =>
                  isModuleEnabled(item.key)
                );

                if (visibleItems.length === 0) return null;

                return (
                  <div key={idx} className={idx > 0 ? "mt-6" : ""}>
                    <p className="px-3 text-xs font-semibold text-text-sub uppercase tracking-wider mb-2">
                      {category.category}
                    </p>
                    {visibleItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => onClose()}
                          className={`
                                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium group
                                      ${isActive
                              ? "bg-primary/10 text-primary-dark dark:text-primary border-l-4 border-primary"
                              : "text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary"
                            }
                                  `}
                        >
                          <span
                            className={`material-symbols-outlined ${isActive
                                ? "filled"
                                : "group-hover:text-primary transition-colors"
                              }`}
                          >
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
            {isModuleEnabled("teacher_settings") && (
              <Link
                href="/teacher/settings"
                onClick={() => onClose()}
                className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-all ${pathname === "/teacher/settings"
                    ? "bg-primary/10 text-primary-dark dark:text-primary border-l-4 border-primary"
                    : "text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
              >
                <span
                  className={`material-symbols-outlined ${pathname === "/teacher/settings" ? "filled" : ""
                    }`}
                >
                  settings
                </span>
                <span className="text-sm font-medium">系統設定</span>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">登出系統</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
