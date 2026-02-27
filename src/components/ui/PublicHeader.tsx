"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NavAuthButtons from "@/components/NavAuthButtons";

export default function PublicHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#101d22]/80 backdrop-blur-lg transition-all">
            <div className="mx-auto flex h-20 max-w-[1024px] items-center justify-between px-6 sm:px-10">
                <Link href="/" className="flex items-center gap-3 group cursor-pointer" onClick={() => setIsMenuOpen(false)}>
                    <div className="relative w-10 h-10 transition-transform duration-300 group-hover:scale-110">
                        <Image
                            src="/logo.svg"
                            alt="TimeCarve Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <h2 className="text-xl font-bold leading-tight tracking-tight text-[#111618] dark:text-white">
                        TimeCarve 刻時
                    </h2>
                </Link>
                <nav className="hidden md:flex items-center gap-10">
                    <Link
                        className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors relative group"
                        href="#"
                    >
                        首頁
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                    </Link>
                    <Link
                        className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors relative group"
                        href="#portfolio"
                    >
                        作品集
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                    </Link>
                    <Link
                        className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors relative group"
                        href="#philosophy"
                    >
                        教學理念
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                    </Link>
                    <Link
                        className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors relative group"
                        href="#courses"
                    >
                        課程資訊
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                    </Link>
                </nav>
                <div className="hidden md:flex items-center gap-4">
                    <NavAuthButtons />
                </div>
                <button
                    onClick={toggleMenu}
                    className="md:hidden flex items-center justify-center text-[#111618] dark:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="material-symbols-outlined">
                        {isMenuOpen ? "close" : "menu"}
                    </span>
                </button>
            </div>

            {/* Mobile Menu */}
            <div
                className={`md:hidden absolute top-20 left-0 w-full bg-white dark:bg-[#101d22] border-b border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="flex flex-col px-6 py-6 gap-6">
                    <nav className="flex flex-col gap-4">
                        <Link
                            className="text-base font-bold text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                            href="#"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            首頁
                        </Link>
                        <Link
                            className="text-base font-bold text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                            href="#portfolio"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            作品集
                        </Link>
                        <Link
                            className="text-base font-bold text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                            href="#philosophy"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            教學理念
                        </Link>
                        <Link
                            className="text-base font-bold text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
                            href="#courses"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            課程資訊
                        </Link>
                    </nav>
                    <div className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>
                    <div className="flex flex-col gap-3">
                        <NavAuthButtons />
                    </div>
                </div>
            </div>
        </header>
    );
}
