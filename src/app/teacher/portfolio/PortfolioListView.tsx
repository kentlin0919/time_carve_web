"use client";

import React from "react";
import { Portfolio } from "@/lib/domain/portfolio/entity";
import Link from "next/link";
import Image from "next/image";

interface PortfolioListViewProps {
  portfolios: Portfolio[];
}

export default function PortfolioListView({
  portfolios,
}: PortfolioListViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6 pb-20">
        {/* Simplified Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex flex-1 w-full md:w-auto items-center gap-2">
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-sub">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="搜尋作品..."
                type="text"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {portfolios.map((work) => (
            <div
              key={work.id}
              className="group bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                {work.cover_image_url ? (
                  <img
                    alt={work.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={work.cover_image_url}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-300 text-6xl">
                      image_not_supported
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Link
                    href={`/teacher/portfolio/${work.id}`}
                    className="p-2 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white rounded-full hover:bg-primary hover:text-white transition-colors shadow-lg"
                    title="編輯"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      edit
                    </span>
                  </Link>
                  <Link
                    href={`/teacher/portfolio/${work.id}/preview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white rounded-full hover:bg-primary hover:text-white transition-colors shadow-lg"
                    title="預覽"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      visibility
                    </span>
                  </Link>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm border ${work.status === "published"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : work.status === "draft"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                  >
                    {work.status === "published"
                      ? "已發布"
                      : work.status === "draft"
                        ? "草稿"
                        : "封存"}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {work.type?.name || work.category || "未分類"}
                  </span>
                  <span className="text-xs text-text-sub">
                    {new Date(work.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                  {work.title}
                </h3>
                <p className="text-sm text-text-sub line-clamp-2 mb-4">
                  {work.description || "暫無描述"}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border-light dark:border-border-dark">
                  <div className="flex items-center gap-3 text-xs text-text-sub">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        visibility
                      </span>{" "}
                      {work.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        favorite
                      </span>{" "}
                      {work.likes_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/teacher/portfolio/new"
            className="group border-2 border-dashed border-border-light dark:border-border-dark rounded-2xl flex flex-col items-center justify-center p-8 text-center text-text-sub hover:border-primary hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer min-h-[350px]"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
              <span className="material-symbols-outlined text-3xl">add</span>
            </div>
            <h3 className="font-bold text-lg mb-1">新增作品集</h3>
            <p className="text-sm max-w-[200px]">
              開始創建新的假牙雕刻展示作品
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
