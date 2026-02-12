"use client";

import React, { useState } from "react";
import { PortfolioMedia } from "@/lib/domain/portfolio/entity";
import { updatePortfolioMedia, deletePortfolioMedia, uploadPortfolioMedia } from "@/app/actions/portfolio";
import { useModal } from "@/components/providers/ModalContext";
import { useRouter } from "next/navigation";

interface PortfolioMediaManagerProps {
    portfolioId: string;
    media: PortfolioMedia[];
}

export default function PortfolioMediaManager({ portfolioId, media }: PortfolioMediaManagerProps) {
    const router = useRouter();
    const { showModal } = useModal();
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState("");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];

        // Open a modal to enter description before uploading? 
        // Or upload first and then edit? 
        // Let's do a simple flow: standard upload first (with empty desc), then user can edit.
        // Or better: prompt for description?
        // User requested: "click + to add image and text input"
        // So let's make a small form for adding.

        // But since we can't easily intercept the file input with a custom UI without state,
        // let's just trigger a modal with the file selected.

        // Actually, let's keep it simple: Upload immediately, then show as a card where they can edit description.

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("portfolioId", portfolioId);

        try {
            await uploadPortfolioMedia(formData);
            router.refresh();
            showModal({ type: "success", title: "上傳成功", description: "圖片已新增，您可以編輯說明文字" });
        } catch (error) {
            console.error(error);
            showModal({ type: "error", title: "上傳失敗", description: "請稍後重試" });
        } finally {
            setUploading(false);
            e.target.value = ""; // Reset input
        }
    };

    const handleSaveDescription = async (id: string) => {
        try {
            await updatePortfolioMedia(id, { description: editDescription });
            setEditingId(null);
            router.refresh();
        } catch (error) {
            showModal({ type: "error", title: "儲存失敗", description: "無法更新說明" });
        }
    };

    const handleDelete = async (id: string) => {
        showModal({
            type: "warning",
            title: "確定刪除？",
            description: "此動作無法復原。",
            confirmText: "刪除",
            showCancel: true,
            onConfirm: async () => {
                try {
                    await deletePortfolioMedia(id);
                    router.refresh();
                } catch (error) {
                    showModal({ type: "error", title: "刪除失敗" });
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">作品集內容（卡片模式）</h3>
                <label className="cursor-pointer px-4 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">add</span>
                    新增內容卡片
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {media.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm flex flex-col group">
                        <div className="relative aspect-video bg-slate-100">
                            {item.file_type === 'video' ? (
                                <video src={item.file_url} className="w-full h-full object-cover" controls />
                            ) : (
                                <img src={item.file_url} alt="Media" className="w-full h-full object-cover" />
                            )}
                            <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                                title="刪除"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                            {editingId === item.id ? (
                                <div className="space-y-3 flex-1">
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-primary/50 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 outline-none text-sm min-h-[100px]"
                                        placeholder="輸入圖片說明..."
                                        autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={() => handleSaveDescription(item.id)}
                                            className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary-dark"
                                        >
                                            儲存
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 -m-2 p-2 rounded-lg transition-colors group/text"
                                    onClick={() => {
                                        setEditingId(item.id);
                                        setEditDescription(item.description || "");
                                    }}
                                >
                                    <p className={`text-sm leading-relaxed ${!item.description ? 'text-slate-400 italic' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {item.description || "點擊新增說明文字..."}
                                    </p>
                                    <div className="mt-2 text-xs text-primary opacity-0 group-hover/text:opacity-100 transition-opacity font-bold">
                                        點擊編輯
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {media.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        尚未新增任何卡片內容
                    </div>
                )}
            </div>
        </div>
    );
}
