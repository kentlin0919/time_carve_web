"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PortfolioMedia } from "@/lib/domain/portfolio/entity";

interface PortfolioGalleryViewerProps {
    media: PortfolioMedia[];
}

export default function PortfolioGalleryViewer({ media }: PortfolioGalleryViewerProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedIndex(null);
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
        };
        if (selectedIndex !== null) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden"; // Prevent scrolling
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "auto";
        };
    }, [selectedIndex]);

    const handlePrev = useCallback(() => {
        setSelectedIndex((prev) => {
            if (prev === null) return null;
            return prev === 0 ? media.length - 1 : prev - 1;
        });
    }, [media.length]);

    const handleNext = useCallback(() => {
        setSelectedIndex((prev) => {
            if (prev === null) return null;
            return prev === media.length - 1 ? 0 : prev + 1;
        });
    }, [media.length]);

    if (!media || media.length === 0) return null;

    const currentItem = selectedIndex !== null ? media[selectedIndex] : null;

    return (
        <>
            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {media.map((item, index) => (
                    <div
                        key={item.id}
                        onClick={() => setSelectedIndex(index)}
                        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col group cursor-pointer"
                    >
                        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                            {item.file_type === "video" ? (
                                <div className="relative w-full h-full">
                                    <video
                                        src={item.file_url}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                        <span className="material-symbols-outlined text-white text-4xl opacity-90 group-hover:scale-110 transition-transform">
                                            play_circle
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-full">
                                    <img
                                        src={item.file_url}
                                        alt="Gallery Item"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">
                                            visibility
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                            {item.description ? (
                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                                    {item.description}
                                </p>
                            ) : (
                                <p className="text-slate-400 text-sm italic">無說明文字</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            {selectedIndex !== null && currentItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedIndex(null)}
                        className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>

                    {/* Navigation Buttons (Desktop) */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden md:block"
                    >
                        <span className="material-symbols-outlined text-4xl">chevron_left</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden md:block"
                    >
                        <span className="material-symbols-outlined text-4xl">chevron_right</span>
                    </button>

                    {/* Main Content Container */}
                    <div
                        className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left: Media Area (65%) */}
                        <div className="w-full md:w-[65%] bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[600px] lg:min-h-[700px]">
                            {currentItem.file_type === 'video' ? (
                                <video
                                    src={currentItem.file_url}
                                    className="w-full h-full max-h-[85vh] object-contain"
                                    controls
                                    autoPlay
                                />
                            ) : (
                                <img
                                    src={currentItem.file_url}
                                    alt="Full View"
                                    className="w-full h-full max-h-[85vh] object-contain"
                                />
                            )}
                        </div>

                        {/* Right: Info Area (35%) */}
                        <div className="w-full md:w-[35%] flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800">
                            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        {selectedIndex + 1} / {media.length}
                                    </span>
                                    {/* Mobile Nav inside content area for easier reach */}
                                    <div className="flex gap-2 md:hidden">
                                        <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded-full">
                                            <span className="material-symbols-outlined">chevron_left</span>
                                        </button>
                                        <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded-full">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </div>
                                </div>

                                {currentItem.description ? (
                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                                            {currentItem.description}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-40 flex items-center justify-center text-slate-400 italic">
                                        沒有更多說明資訊
                                    </div>
                                )}
                            </div>

                            {/* Footer / Actions area (can add share buttons, etc here) */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center text-xs text-slate-400">
                                TimeCarve Portfolio Gallery
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
