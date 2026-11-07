"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/modal";
import { TextArea } from "@/components/ui";

export type Target = {
  id: string;
  label: string;
  badge: string;
  href: (shareText: string, url: string) => string;
};

// LinkedIn's feed endpoint is the only one that opens a *post* draft with text
// prefilled; the share-offsite button drops the body, so we use the feed URL.
export const TARGETS: Target[] = [
  {
    id: "linkedin",
    label: "LinkedIn post",
    badge: "in",
    href: (text, url) =>
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
  {
    id: "x",
    label: "X / Twitter",
    badge: "X",
    href: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    badge: "W",
    href: (text, url) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    badge: "f",
    href: (_text, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "email",
    label: "Email",
    badge: "@",
    href: (text, url) =>
      `mailto:?body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

export function ShareSheet({
  open,
  onClose,
  defaultText,
  url,
}: {
  open: boolean;
  onClose: () => void;
  defaultText: string;
  url: string;
}) {
  const [draft, setDraft] = useState(defaultText);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setDraft(defaultText);
  }, [open, defaultText]);

  const text = useMemo(() => draft.trim() || defaultText, [draft, defaultText]);

  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ text, url });
    } catch {
      /* user dismissed the sheet */
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Share this onWard">
      <p className="mb-3 text-[11.5px] leading-[1.5] text-muted">
        Edit the wording, then pick where to post it.
      </p>
      <TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-[132px] text-[13px]"
        aria-label="Share text"
      />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {TARGETS.map((t) => (
          <a
            key={t.id}
            href={t.href(text, url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper px-2 py-3.5 transition hover:border-lime-deep/60 active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-soft text-[13px] font-bold text-ink">
              {t.badge}
            </span>
            <span className="text-[10.5px] font-semibold leading-tight text-inksoft">
              {t.label}
            </span>
          </a>
        ))}
        <button
          type="button"
          onClick={copy}
          className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper px-2 py-3.5 transition hover:border-lime-deep/60 active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-ink">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </span>
          <span className="text-[10.5px] font-semibold leading-tight text-inksoft">
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>
      {hasNativeShare ? (
        <button
          type="button"
          onClick={nativeShare}
          className="mt-3 w-full rounded-btn border border-line bg-paper py-2.5 text-[12px] font-bold text-inksoft"
        >
          More apps
        </button>
      ) : null}
      <p className="mt-3 text-center text-[9.5px] leading-[1.5] text-faint">
        {url}
      </p>
    </Modal>
  );
}

/** The wording a shared onWard goes out with. */
export function wardShareText(ward: {
  title: string;
  impact: string;
  skills: string[];
  dateLabel?: string;
}) {
  const skills = ward.skills.length ? `\n\nSkills: ${ward.skills.join(", ")}` : "";
  return `${ward.title}\n\n${ward.impact}${skills}`;
}
