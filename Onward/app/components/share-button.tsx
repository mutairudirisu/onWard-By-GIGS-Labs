"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({
  title,
  text,
  url = "https://onward.app",
  className = "",
  label = "Share",
  icon = true,
}: {
  title?: string;
  text: string;
  url?: string;
  className?: string;
  label?: string;
  icon?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* user dismissed — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button type="button" onClick={onShare} className={className}>
      {icon ? (
        copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Share2 className="h-4 w-4" />
        )
      ) : null}
      {label ? <span>{copied ? "Copied link" : label}</span> : null}
    </button>
  );
}
