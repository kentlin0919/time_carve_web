"use client";

import { useToastContext } from "@/components/ui/Toast";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
  duration?: number;
}

export function useToast() {
  const { toasts, addToast, removeToast } = useToastContext();

  const toast = (props: ToastProps) => {
    addToast(props);
  };

  return { toast, toasts, removeToast };
}
