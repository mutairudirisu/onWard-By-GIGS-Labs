"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-[1px]"
        style={{ animation: "onward-fade 0.15s ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl bg-paper shadow-lift sm:max-w-md"
        style={{ animation: "onward-sheet 0.22s ease-out" }}
      >
        {title != null ? (
          <div className="flex items-center justify-between px-5 pb-1 pt-4">
            <h2 className="text-[16px] font-bold tracking-tight text-ink lg:text-[18px]">
              {title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-1 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-cream"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        ) : null}
        <div className="overflow-y-auto px-5 pb-5 pt-2">{children}</div>
      </div>
    </div>
  );
}
