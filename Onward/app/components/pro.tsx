"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Modal } from "@/components/modal";

export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-dark ${className}`}
    >
      <Sparkles className="h-2.5 w-2.5" strokeWidth={2.8} />
      Pro
    </span>
  );
}

export function UpgradeModal({
  open,
  onClose,
  feature,
  blurb,
  title,
}: {
  open: boolean;
  onClose: () => void;
  feature: string;
  blurb: string;
  title?: string;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="pt-1 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-soft text-lime-deep">
          <Sparkles className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <h2 className="mt-3 text-[17px] font-bold tracking-tight text-ink">
          {title ?? `${feature} is a Pro feature`}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[34ch] text-[13px] leading-[1.5] text-muted">
          {blurb}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/upgrade"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-btn bg-lime px-4 py-3 text-[13px] font-bold text-dark transition hover:bg-lime-deep"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.6} />
            Upgrade to Pro
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn px-4 py-2.5 text-[13px] font-semibold text-muted transition hover:text-ink"
          >
            Maybe later
          </button>
        </div>
        <p className="mt-3 text-[11px] text-faint">
          Free keeps your full history and export rights forever.
        </p>
      </div>
    </Modal>
  );
}
