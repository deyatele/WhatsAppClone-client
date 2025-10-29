"use client";

import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm w-full m-4 text-white"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
      >
        {children}
      </div>
    </div>
  );
}
