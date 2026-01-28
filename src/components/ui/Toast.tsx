"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: "default" | "success" | "destructive";
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).slice(2);
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);

        // Auto remove after duration (default 3s)
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, toast.duration || 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToastContext must be used within a ToastProvider");
    }
    return context;
}

// Toast Container Component
function ToastContainer({
    toasts,
    removeToast,
}: {
    toasts: Toast[];
    removeToast: (id: string) => void;
}) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

// Single Toast Item
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const variantStyles = {
        default: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        success: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
        destructive: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    };

    const iconStyles = {
        default: "text-primary",
        success: "text-emerald-600 dark:text-emerald-400",
        destructive: "text-red-600 dark:text-red-400",
    };

    const icons = {
        default: "info",
        success: "check_circle",
        destructive: "error",
    };

    const variant = toast.variant || "default";

    return (
        <div
            className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm
        animate-in slide-in-from-right-full fade-in duration-300
        ${variantStyles[variant]}
      `}
            role="alert"
        >
            <span className={`material-symbols-outlined text-xl ${iconStyles[variant]}`}>
                {icons[variant]}
            </span>
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {toast.title}
                    </p>
                )}
                {toast.description && (
                    <p className="text-slate-600 dark:text-slate-300 text-sm mt-0.5">
                        {toast.description}
                    </p>
                )}
            </div>
            <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    );
}
