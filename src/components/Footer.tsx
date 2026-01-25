"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PlatformSettings {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  facebook_url: string;
  instagram_url: string;
  line_url: string;
}

export default function Footer() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("platform_settings").select("*");
      if (data) {
        const settingsMap: any = {};
        data.forEach((item: any) => {
          settingsMap[item.key] = item.value;
        });
        setSettings(settingsMap);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-[#f0f3f4] dark:border-gray-800 py-10 px-6 lg:px-40">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative size-6">
              <Image
                src="/logo.svg"
                alt="TimeCarve Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[#111618] dark:text-white font-bold">
              TimeCarve 刻時
            </span>
          </div>
          <p className="text-[#617f89] dark:text-gray-500 text-sm">
            © 2025 TimeCarve 刻時. All rights reserved.
          </p>
          {settings && (
            <div className="text-xs text-text-sub mt-2 space-y-1">
              {settings.contact_phone && <p>電話: {settings.contact_phone}</p>}
              {settings.contact_email && <p>信箱: {settings.contact_email}</p>}
              {settings.contact_address && <p>地址: {settings.contact_address}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex gap-6">
            <Link
              className="text-[#617f89] dark:text-gray-500 hover:text-primary transition-colors text-sm font-medium"
              href="/legal/privacy"
            >
              隱私權政策
            </Link>
            <Link
              className="text-[#617f89] dark:text-gray-500 hover:text-primary transition-colors text-sm font-medium"
              href="/legal/terms"
            >
              服務條款
            </Link>
            <Link
              className="text-[#617f89] dark:text-gray-500 hover:text-primary transition-colors text-sm font-medium"
              href="/faq"
            >
              常見問題
            </Link>
          </div>

          {settings && (
            <div className="flex gap-4">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <i className="fa-brands fa-facebook text-xl"></i> FB
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                  IG
                </a>
              )}
              {settings.line_url && (
                <a href={settings.line_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                  Line
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
