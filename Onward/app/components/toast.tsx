"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";

export type ToastKind = "success" | "error";
export type ToastAction = { label: string; onClick: () => void };
export type Toast = { id: number; kind: ToastKind; message: string; action?: ToastAction };

// A module store rather than a context: the data layer reports its own outcomes,
// and it sits below the provider tree.
let seq = 0;
let toasts: Toast[] = [];
const listeners = new Set<(items: Toast[]) => void>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function dismissToast(id: number) {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function pushToast(kind: ToastKind, message: string, action?: ToastAction) {
  const id = ++seq;
  // Repeating the same message replaces it, so a burst of saves stays readable.
  const kept = toasts.filter((t) => !(t.kind === kind && t.message === message));
  toasts = [...kept, { id, kind, message, action }].slice(-3);
  emit();
  // An undo has to be readable and reachable, so it waits longer than a plain tick.
  const ms = kind === "error" ? 5200 : action ? 5000 : 2600;
  setTimeout(() => dismissToast(id), ms);
}

export const toastSuccess = (message: string) => pushToast("success", message);
export const toastError = (message: string) => pushToast("error", message);
/** The app did the thing and can take it back - say both in one place. */
export const toastUndoable = (message: string, label: string, onClick: () => void) =>
  pushToast("success", message, { label, onClick });

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    setItems(toasts);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  if (!items.length) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[120px] z-[80] mx-auto flex w-full max-w-[400px] flex-col items-center gap-2 px-5 md:bottom-8 md:max-w-[560px]"
    >
      {items.map((toast) => (
        <div
          key={toast.id}
          style={{ animation: "onward-sheet 0.18s ease-out" }}
          className="pointer-events-auto flex w-full max-w-[340px] items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 shadow-lift"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              toast.kind === "success" ? "bg-lime text-dark" : "bg-[#E5484D] text-paper"
            }`}
          >
            {toast.kind === "success" ? (
              <Check className="h-3 w-3" strokeWidth={3.2} />
            ) : (
              <AlertTriangle className="h-3 w-3" strokeWidth={2.6} />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-paper">
            {toast.message}
          </span>
          {toast.action ? (
            <button
              type="button"
              onClick={() => {
                dismissToast(toast.id);
                toast.action?.onClick();
              }}
              className="-mr-1.5 shrink-0 cursor-pointer rounded-full px-2.5 py-1 text-[11.5px] font-bold text-lime transition hover:bg-lime/15"
            >
              {toast.action.label}
            </button>
          ) : (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismissToast(toast.id)}
              className="-mr-1.5 shrink-0 rounded-full p-1.5 text-paper/60 transition hover:text-paper"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 5l14 14M19 5 5 19"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
