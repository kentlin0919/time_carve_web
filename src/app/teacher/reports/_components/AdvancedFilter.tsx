"use client";

import React, { useState } from "react";

export type AdvancedFilterValues = {
    startDate: string;
    endDate: string;
    courseType: string;
    minAmount: string;
    maxAmount: string;
};

interface AdvancedFilterProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: AdvancedFilterValues) => void;
    initialValues?: Partial<AdvancedFilterValues>;
}

export function AdvancedFilter({
    isOpen,
    onClose,
    onApply,
    initialValues,
}: AdvancedFilterProps) {
    const [startDate, setStartDate] = useState(initialValues?.startDate || "");
    const [endDate, setEndDate] = useState(initialValues?.endDate || "");
    const [courseType, setCourseType] = useState(initialValues?.courseType || "");
    const [minAmount, setMinAmount] = useState(initialValues?.minAmount || "");
    const [maxAmount, setMaxAmount] = useState(initialValues?.maxAmount || "");

    const handleClear = () => {
        setStartDate("");
        setEndDate("");
        setCourseType("");
        setMinAmount("");
        setMaxAmount("");
    };

    const handleApply = () => {
        onApply({ startDate, endDate, courseType, minAmount, maxAmount });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                            filter_list
                        </span>
                        進階篩選
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined text-text-sub">
                            close
                        </span>
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                            日期範圍
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-3 pr-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                    placeholder="開始日期"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-3 pr-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                    placeholder="結束日期"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Course Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                            課程類型
                        </label>
                        <select
                            value={courseType}
                            onChange={(e) => setCourseType(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none appearance-none cursor-pointer"
                        >
                            <option value="">所有類型</option>
                            <option value="一對一指導">一對一指導</option>
                            <option value="團體課程">團體課程</option>
                            <option value="線上課程">線上課程</option>
                        </select>
                    </div>

                    {/* Amount Range */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                            金額範圍
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-sm">
                                    $
                                </span>
                                <input
                                    type="number"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                    placeholder="最低"
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-sm">
                                    $
                                </span>
                                <input
                                    type="number"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                                    placeholder="最高"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-border-light dark:border-border-dark">
                    <button
                        onClick={handleClear}
                        className="text-sm text-text-sub hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                        清除篩選
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-lg shadow-primary/30 transition-all active:scale-95"
                        >
                            套用篩選
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
