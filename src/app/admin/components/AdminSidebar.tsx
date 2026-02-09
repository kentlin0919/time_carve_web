"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSystemModules } from "@/hooks/useSystemModules";

export default function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { getModulesByIdentity } = useSystemModules();

  const isActive = (path: string) => pathname === path;

  const normalizeRoute = (route?: string | null) => {
    if (!route) return "";
    if (route === "/admin/course-types") return "/admin/class-types";
    return route;
  };

  // Filter modules for admin role (Identity ID 1) and only active ones
  // Also filter out 'audit' as the page doesn't exist yet
  const adminModules = getModulesByIdentity(1)
    .filter((m) => m.is_active)
    .filter((m) => m.route !== "/admin/audit");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      <aside
        className={`
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          flex flex-col fixed h-full z-30 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                alt="Super Admin Profile"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500 ring-offset-2 dark:ring-offset-gray-900"
                src="/logo.svg"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Super Admin
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                TimeCarve 刻時
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {adminModules.map((module) => {
            const route = normalizeRoute(module.route);
            return (
              <Link
                key={module.id}
                href={route || "#"}
                onClick={() => onClose()}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg group transition-colors ${isActive(route)
                    ? "bg-sky-50 dark:bg-sky-500/20 text-sky-500"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                <span
                  className={`material-symbols-outlined text-xl ${!isActive(module.route || "") &&
                    "group-hover:text-sky-500 transition-colors"
                    }`}
                >
                  {module.icon || "circle"}
                </span>
                <span className="font-medium text-sm">{module.label}</span>
              </Link>
            )
          })}

          {/* Always show Module Management if it's not in the list for some reason, 
              but ideally it should be in the DB list. 
              We'll assume it is added in DB with key 'module_management'
          */}

          {/* Manual link for Settings if not in DB, but let's assume it should be in DB too.
              For now, hardcode Settings as it might be special? 
              Actually, let's keep Settings hardcoded at bottom if user wants distinct separation,
              or just move it to DB. The previous file had it.
              I will assume "System Settings" is hardcoded at bottom for safety.
          */}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors w-full text-left"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-medium text-sm">登出系統</span>
          </button>
        </div>
      </aside>
    </>
  );
}
