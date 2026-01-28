"use client";

import React, { useState } from "react";
import { Portfolio } from "@/lib/domain/portfolio/entity";
import { useModal } from "@/components/providers/ModalContext";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse" />,
});
import {
  updatePortfolio,
  createPortfolio,
  uploadPortfolioMedia,
  getPortfolioTypes,
} from "@/app/actions/portfolio";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PortfolioEditFormProps {
  initialData?: Portfolio;
  teacherId?: string;
  isCreating?: boolean;
}

export default function PortfolioEditForm({
  initialData,
  teacherId,
  isCreating = false,
}: PortfolioEditFormProps) {
  const router = useRouter();
  const { showModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const [formData, setFormData] = useState<Partial<Portfolio>>(
    initialData || {
      title: "",
      description: "",
      content: "",
      category: "",
      status: "draft",
      allow_comments: true,
    }
  );

  // Load types
  const [types, setTypes] = useState<any[]>([]);

  React.useEffect(() => {
    getPortfolioTypes().then((data) => {
      setTypes(data);
      // Auto-set type_id if not set but category matches (migration helper)
      if (!initialData?.type_id && initialData?.category) {
        const match = data.find((t: any) => t.name === initialData.category);
        if (match) {
          setFormData(prev => ({ ...prev, type_id: match.id }));
        }
      }
    });
  }, [initialData]);

  // Handle type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const typeId = e.target.value;
    const type = types.find(t => t.id === typeId);
    setFormData(prev => ({
      ...prev,
      type_id: typeId,
      category: type?.name || "" // Sync category name for backward compatibility if needed, or just for display
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isCreating) {
        const newPortfolio = await createPortfolio(formData);
        showModal({ type: "success", title: "建立成功", description: "作品集已成功建立", confirmText: "確定" });
        router.push(`/teacher/portfolio/${newPortfolio.id}`);
      } else if (initialData?.id) {
        await updatePortfolio(initialData.id, formData);
        showModal({ type: "success", title: "儲存成功", description: "作品集已成功更新", confirmText: "確定" });
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving portfolio:", error);
      showModal({ type: "error", title: "儲存失敗", description: "請稍後重試", confirmText: "確定" });
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !initialData?.id) return;

    // Handle multiple files
    const files = Array.from(e.target.files);
    setLoading(true);

    try {
      // Parallel uploads
      await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("portfolioId", initialData.id);
          await uploadPortfolioMedia(formData);
        })
      );

      router.refresh();
    } catch (error) {
      console.error("Upload failed:", error);
      showModal({ type: "error", title: "上傳失敗", description: "部分檔案上傳失敗，請重試", confirmText: "確定" });
    } finally {
      // Clear input value to allow re-uploading same file if needed
      e.target.value = '';
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      setLoading(true);
      const { uploadPortfolioCoverImage } = await import("@/app/actions/portfolio");
      const url = await uploadPortfolioCoverImage(uploadFormData);
      setFormData({ ...formData, cover_image_url: url });
    } catch (error) {
      console.error("Cover upload failed:", error);
      showModal({ type: "error", title: "上傳失敗", description: "封面圖片上傳失敗", confirmText: "確定" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* ... keeping header ... */}
      <div className="flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur z-10 py-4 border-b border-border-light dark:border-border-dark mb-6">
        <h1 className="text-2xl font-bold">
          {isCreating ? "新增作品" : "編輯作品"}
        </h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="material-symbols-outlined animate-spin text-sm">
                progress_activity
              </span>
            )}
            {isCreating ? "建立" : "儲存變更"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4 bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                作品標題
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all text-lg font-medium"
                placeholder="例如：全口假牙排牙展示"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                簡短描述
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none h-24"
                placeholder="簡單介紹這個作品的亮點..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                詳細內容
              </label>
              <RichTextEditor
                content={formData.content || ""}
                onChange={(html) => setFormData({ ...formData, content: html })}
              />
            </div>
          </div>

          {/* Media Gallery Section */}
          {!isCreating && initialData && (
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">詳細觀看（多圖作品集）</h3>
                <label className="cursor-pointer px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    add_photo_alternate
                  </span>
                  上傳多張圖片
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    disabled={loading}
                  />
                </label>
              </div>

              {initialData.media && initialData.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {initialData.media.map((media) => (
                    <div
                      key={media.id}
                      className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100"
                    >
                      <img
                        src={media.file_url}
                        alt="media"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          className="text-white hover:text-red-400"
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-text-sub border-2 border-dashed border-border-light dark:border-border-dark rounded-xl">
                  尚未上傳詳細圖片
                </div>
              )}
            </div>
          )}

          {isCreating && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm flex items-center gap-3">
              <span className="material-symbols-outlined">info</span>
              建立作品後，即可上傳更多詳細圖片到媒體庫。
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                發布狀態
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50"
              >
                <option value="draft">草稿 (Draft)</option>
                <option value="published">已發布 (Published)</option>
                <option value="archived">已封存 (Archived)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  分類
                </label>
                <Link
                  href="/teacher/portfolio/types"
                  target="_blank"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                  管理分類
                </Link>
              </div>
              <select
                value={formData.type_id || ""}
                onChange={handleTypeChange}
                className="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50"
              >
                <option value="">選擇分類...</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => getPortfolioTypes().then(setTypes)}
                  className="text-xs text-slate-500 hover:text-primary flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  刷新列表
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                封面圖片
              </label>

              {!formData.cover_image_url ? (
                <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-border-light dark:border-border-dark hover:border-primary/50 bg-slate-50 dark:bg-slate-800/50 cursor-pointer transition-colors group">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-3xl mb-2">add_photo_alternate</span>
                  <span className="text-sm text-slate-500 group-hover:text-primary transition-colors">點擊上傳封面</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                    disabled={loading}
                  />
                </label>
              ) : (
                <div className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100">
                  <img
                    src={formData.cover_image_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white cursor-pointer backdrop-blur-sm transition-colors">
                      <span className="material-symbols-outlined text-xl">edit</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                        disabled={loading}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image_url: null })}
                      className="p-2 bg-white/20 hover:bg-red-500/80 rounded-full text-white backdrop-blur-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="allow_comments"
                checked={formData.allow_comments || false}
                onChange={(e) =>
                  setFormData({ ...formData, allow_comments: e.target.checked })
                }
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="allow_comments"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none"
              >
                允許留言
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
            <h4 className="font-bold mb-4 text-slate-800 dark:text-white">
              公開與分享
            </h4>

            {!isCreating && initialData?.id && (
              <div className="mb-4 space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  公開連結
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${origin}/portfolio/${initialData.id}`}
                    className="flex-1 min-w-0 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 outline-none"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${origin}/portfolio/${initialData.id}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-center ${copied
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600"
                      }`}
                    title="複製連結"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {copied ? "check" : "content_copy"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isCreating}
              onClick={() =>
                initialData?.id && window.open(`/teacher/portfolio/${initialData.id}/preview`, '_blank')
              }
              className="w-full py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[20px]">
                visibility
              </span>
              {isCreating ? "儲存後即可預覽" : "預覽公開頁面"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
