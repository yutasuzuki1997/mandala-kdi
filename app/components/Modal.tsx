"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "default" | "lg";
}

export default function Modal({ open, onClose, title, children, size = "default" }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === "lg"
    ? "w-[90vw] max-w-lg max-h-[85dvh] overflow-y-auto"
    : "w-full max-w-md max-h-[85dvh] overflow-y-auto";

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        className={`${sizeClass} rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5 shadow-xl animate-in slide-in-from-bottom-4 duration-200`}
        style={{
          background: "#ffffff",
          border: "1px solid #d3e3d2",
          color: "#2c3a2e",
        }}
      >
        <div
          className="mb-4 flex items-center justify-between pb-2"
          style={{ borderBottom: "1px solid #d3e3d2" }}
        >
          <h3
            className="text-base"
            style={{ fontFamily: "'Zen Maru Gothic', sans-serif", fontWeight: 600, color: "#2c3a2e" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-[#eef4ee]"
            style={{ color: "#2e9e4f" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
