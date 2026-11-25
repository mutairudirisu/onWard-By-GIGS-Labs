"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import {
  siFacebook,
  siGmail,
  siInstagram,
  siWhatsapp,
  siX,
} from "simple-icons";
import { Modal } from "@/components/ui/modal";
import { TextArea } from "@/components/ui/ui";
import { toastError, toastSuccess } from "@/components/ui/toast";

type BrandIconData = { title: string; hex: string; path: string; viewBox?: string };
const LINKEDIN_ICON: BrandIconData = {
  title: "LinkedIn",
  hex: "0A66C2",
  viewBox: "0 0 24 24",
  path:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.268 2.37 4.268 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z",
};
export type Target = {
  id: string;
  label: string;
  icon: BrandIconData | "mail";
  nativeShare?: boolean;
  href: (shareText: string, url: string) => string;
};

// LinkedIn's feed endpoint is the only one that opens a *post* draft with text
// prefilled; the share-offsite button drops the body, so we use the feed URL.
export const TARGETS: Target[] = [
  {
    id: "linkedin",
    label: "LinkedIn post",
    icon: LINKEDIN_ICON,
    href: (text, url) =>
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
  {
    id: "x",
    label: "X / Twitter",
    icon: siX,
    href: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: siWhatsapp,
    href: (text, url) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: siFacebook,
    href: (_text, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "gmail",
    label: "Gmail",
    icon: siGmail,
    href: (text, url) =>
      `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("Shared from onWard")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: siInstagram,
    nativeShare: true,
    href: () => "https://www.instagram.com/",
  },
  {
    id: "email",
    label: "Email",
    icon: "mail",
    href: (text, url) =>
      `mailto:?subject=${encodeURIComponent("Shared from onWard")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

export function ShareTargetIcon({
  target,
  className = "h-[18px] w-[18px]",
}: {
  target: Target;
  className?: string;
}) {
  if (target.icon === "mail") {
    return <Mail className={`${className} text-inksoft`} aria-hidden="true" />;
  }
  return (
    <svg
      viewBox={target.icon.viewBox ?? "0 0 24 24"}
      className={className}
      aria-hidden="true"
    >
      <path d={target.icon.path} fill={`#${target.icon.hex}`} />
    </svg>
  );
}

export function ShareSheet({
  open,
  onClose,
  defaultText,
  url,
  title = "Share this onWard",
}: {
  open: boolean;
  onClose: () => void;
  defaultText: string;
  url: string;
  title?: string;
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
      toastError("Couldn't copy the share text");
    }
  }

  async function shareToInstagram(target: Target) {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text, url });
        onClose();
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          toastError("Couldn't open Instagram sharing");
        }
      }
      return;
    }

    window.open(target.href(text, url), "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopied(true);
      toastSuccess("Copied. Paste the link into Instagram.");
      onClose();
    } catch {
      toastError("Couldn't copy the link for Instagram");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ text, url });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        toastError("Couldn't open the share options");
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
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
        {TARGETS.map((target) => {
          const content = (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white">
                <ShareTargetIcon target={target} />
              </span>
              <span className="text-[10.5px] font-semibold leading-tight text-inksoft">
                {target.label}
              </span>
            </>
          );
          const className =
            "flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper px-2 py-3.5 transition hover:border-lime-deep/60 active:scale-[0.98]";

          return target.nativeShare ? (
            <button
              key={target.id}
              type="button"
              onClick={() => void shareToInstagram(target)}
              className={`${className} cursor-pointer`}
            >
              {content}
            </button>
          ) : (
            <a
              key={target.id}
              href={target.href(text, url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className={className}
            >
              {content}
            </a>
          );
        })}
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
