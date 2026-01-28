"use client";

import { useState, useEffect } from "react";
import { useModal } from "@/components/providers/ModalContext";
import {
    getPortfolioTypes,
    createPortfolioType,
    updatePortfolioType,
    deletePortfolioType
} from "@/app/actions/portfolio";
import { PortfolioType } from "@/lib/domain/portfolio/entity";

export default function PortfolioTypesPage() {
    const [types, setTypes] = useState<PortfolioType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentType, setCurrentType] = useState<Partial<PortfolioType>>({});
    const [saving, setSaving] = useState(false);
    const { showModal } = useModal();

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const data = await getPortfolioTypes();
            setTypes(data);
        } catch (error) {
            console.error("Error fetching types:", error);
            showModal({ type: "error", title: "讀取失敗", description: "無法載入作品集分類，請稍後再試。", confirmText: "確定" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentType.name?.trim()) return;

        try {
            setSaving(true);
            if (currentType.id) {
                // Update
                await updatePortfolioType(currentType.id, {
                    name: currentType.name,
                    sort_order: currentType.sort_order || 0
                });
                showModal({ type: "success", title: "更新成功", description: "分類已更新。", confirmText: "確定" });
            } else {
                // Create
                await createPortfolioType({
                    name: currentType.name,
                    sort_order: currentType.sort_order || 0
                });
                showModal({ type: "success", title: "新增成功", description: "分類已建立。", confirmText: "確定" });
            }
            setIsEditing(false);
            setCurrentType({});
            fetchTypes();
        } catch (error) {
            console.error("Error saving type:", error);
            showModal({ type: "error", title: "儲存失敗", description: "操作失敗，請稍後再試。", confirmText: "確定" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("確定要刪除此分類嗎？包含此分類的作品集將會變為未分類。")) return;

        try {
            await deletePortfolioType(id);
            showModal({ type: "success", title: "刪除成功", description: "分類已刪除。", confirmText: "確定" });
            fetchTypes();
        } catch (error) {
            console.error("Error deleting type:", error);
            showModal({ type: "error", title: "刪除失敗", description: "刪除失敗，該分類可能正在使用中或發生錯誤。", confirmText: "確定" });
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        作品集分類管理
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        建立與管理您的自訂作品分類，讓作品集更有組織。
                    </p>
                </div>
                <button
                    onClick={() => {
                        setCurrentType({ sort_order: types.length * 10 });
                        setIsEditing(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm"
                >
                    <span className="material-symbols-outlined">add</span>
                    新增分類
                </button>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-sm font-medium border-b border-border-light dark:border-border-dark">
                        <tr>
                            <th className="px-6 py-4 w-20 text-center">排序</th>
                            <th className="px-6 py-4">分類名稱</th>
                            <th className="px-6 py-4 text-right">建立時間</th>
                            <th className="px-6 py-4 text-right w-32">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
                                    <p>載入中...</p>
                                </td>
                            </tr>
                        ) : types.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <span className="material-symbols-outlined text-4xl text-gray-300">category</span>
                                        <p>尚無自訂分類</p>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-primary hover:underline text-sm"
                                        >
                                            立即建立第一個分類
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            types.map((type) => (
                                <tr
                                    key={type.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="px-6 py-4 text-center text-gray-500 font-mono text-sm">
                                        {type.sort_order}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                        {type.name}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(type.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setCurrentType(type);
                                                    setIsEditing(true);
                                                }}
                                                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                                title="編輯"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(type.id)}
                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                title="刪除"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Create Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 transform transition-all scale-100 opacity-100">
                        <form onSubmit={handleSave}>
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {currentType.id ? "編輯分類" : "新增分類"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        分類名稱 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={currentType.name || ""}
                                        onChange={(e) =>
                                            setCurrentType({ ...currentType, name: e.target.value })
                                        }
                                        placeholder="例如：假牙案例"
                                        className="w-full px-4 py-2 rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        排序權重
                                    </label>
                                    <input
                                        type="number"
                                        value={currentType.sort_order || 0}
                                        onChange={(e) =>
                                            setCurrentType({ ...currentType, sort_order: parseInt(e.target.value) || 0 })
                                        }
                                        className="w-full px-4 py-2 rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        數字越小越靠前 (支援負數)
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30 disabled:opacity-60 font-bold flex items-center gap-2"
                                >
                                    {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                    {saving ? "儲存中..." : "儲存"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
