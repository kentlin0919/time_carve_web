"use client";

import { ModalProvider } from "./ModalContext";
import GlobalOnboardingGuard from "../GlobalOnboardingGuard";
import { ToastProvider } from "../ui/Toast";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ModalProvider>
        <GlobalOnboardingGuard />
        {children}
      </ModalProvider>
    </ToastProvider>
  );
}
