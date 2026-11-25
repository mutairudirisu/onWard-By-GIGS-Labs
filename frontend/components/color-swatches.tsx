"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function ColorSwatches({
  colors,
}: {
  colors: [string, string, string][];
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      window.setTimeout(
        () => setCopied((c) => (c === hex ? null : c)),
        1400,
      );
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {colors.map(([name, hex, fg]) => (
        <button
          key={hex}
          type="button"
          onClick={() => copy(hex)}
          aria-label={`Copy ${name} ${hex}`}
          className="group overflow-hidden rounded-2xl border border-line bg-paper text-left shadow-card transition hover:-translate-y-0.5"
        >
          <span
            style={{ backgroundColor: hex }}
            className="flex h-16 items-end justify-end p-2"
          >
            <span
              className={`flex items-center gap-1 text-[11px] font-bold opacity-0 transition group-hover:opacity-100 ${fg}`}
            >
              {copied === hex ? (
                <>
                  <Check className="h-3 w-3" strokeWidth={3} /> Copied
                </>
              ) : (
                "Copy"
              )}
            </span>
          </span>
          <span className="block px-3 py-2.5">
            <span className="block text-[13px] font-bold text-ink">{name}</span>
            <span className="block font-mono text-[11.5px] uppercase text-muted">
              {hex}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
