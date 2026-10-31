"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[12.5px] font-bold text-ink transition hover:border-ink/30 ${className}`}
    >
      {done ? (
        <>
          <Check className="h-3.5 w-3.5 text-lime-deep" strokeWidth={2.6} /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" strokeWidth={2.2} /> {label}
        </>
      )}
    </button>
  );
}
