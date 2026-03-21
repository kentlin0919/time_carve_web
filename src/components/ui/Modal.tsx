"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type ModalType = "info" | "success" | "warning" | "error";
export type ModalSize = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  type?: ModalType;
  size?: ModalSize;
  showConfirm?: boolean;
  confirmText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  cancelText?: string;
  onCancel?: () => void;
  closable?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title = "TimeCarve 刻時",
  description,
  children,
  type = "info",
  size = "md",
  showConfirm = true,
  confirmText = "我知道了",
  onConfirm,
  showCancel = false,
  cancelText = "取消",
  onCancel,
  closable = true,
}: ModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setVisible(false), 300); // Wait for fade out
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!visible && !isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
        }`}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[6px]"
        onClick={closable ? onClose : undefined}
      ></div>
      <div
        className={`relative w-full transform rounded-[32px] bg-white dark:bg-gray-800 p-8 text-left shadow-2xl transition-all duration-300 border border-slate-100 dark:border-gray-700 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          } ${size === "sm"
            ? "max-w-[360px]"
            : size === "lg"
              ? "max-w-[720px]"
              : size === "xl"
                ? "max-w-[900px]"
                : "max-w-[420px]"
          }`}
      >
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="size-14 text-primary bg-blue-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mb-4 p-2.5 shadow-sm">
            {type === "success" ? (
              <span className="material-symbols-outlined text-[32px]">
                check_circle
              </span>
            ) : type === "error" ? (
              <span className="material-symbols-outlined text-[32px]">
                error
              </span>
            ) : type === "warning" ? (
              <span className="material-symbols-outlined text-[32px]">
                warning
              </span>
            ) : (
              <Image
                src="/logo.svg"
                alt="TimeCarve"
                width={32}
                height={32}
                className="object-contain w-8 h-8"
              />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-400 mt-1 font-medium">
              {description}
            </p>
          )}
        </div>

        <div className="space-y-4 mb-8">{children}</div>

        <div className="mt-8 flex gap-3">
          {showCancel && (
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 sm:py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {cancelText}
            </button>
          )}
          {showConfirm && (
            <button
              onClick={handleConfirm}
              className="group w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 sm:py-2 rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{confirmText}</span>
              <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                arrow_forward
              </span>
            </button>
          )}
        </div>

        {closable && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
