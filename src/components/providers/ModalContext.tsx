"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Modal, ModalType, ModalSize } from "@/components/ui/Modal";

interface ModalOptions {
  title?: string;
  description?: string;
  type?: ModalType;
  size?: ModalSize;
  confirmText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  cancelText?: string;
  onCancel?: () => void;
  children?: ReactNode;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<ModalOptions>({});

  const showModal = (options: ModalOptions) => {
    setModalProps(options);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    // Optional: clear props after animation, but keeping them prevents content jump during fade out
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <Modal isOpen={isOpen} onClose={hideModal} {...modalProps} />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
