"use client";

import { useEffect, useState } from "react";
import { Share } from "lucide-react";
import { Modal } from "@/components/modal";

export function InstallInstructionsOnRequest() {
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("install") !== "1") return;

    url.searchParams.delete("install");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const userAgent = window.navigator.userAgent || "";
    setIos(
      /iphone|ipad|ipod/i.test(userAgent) ||
        (/macintosh/i.test(userAgent) && "ontouchend" in document),
    );
    setOpen(true);
  }, []);

  function dismiss() {
    setOpen(false);
  }

  return (
    <Modal open={open} onClose={dismiss} title="Install onWard">
      <div className="space-y-4 pt-2">
        <p className="text-[13px] leading-relaxed text-inksoft">
          Add onWard to your Home Screen for a quicker, app-like way to plan,
          capture progress, and stay connected.
        </p>

        {ios ? (
          <div className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-[12px] font-bold text-ink">Install on iPhone or iPad</p>
            <p className="mt-3 flex items-start gap-2.5 text-[12px] leading-relaxed text-inksoft">
              <Share className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep" />
              Tap Share, choose “Add to Home Screen,” then tap “Add.”
            </p>
          </div>
        ) : (
          <p className="rounded-2xl border border-line bg-cream p-4 text-[12px] leading-relaxed text-inksoft">
            Open your browser menu and choose “Install onWard” or “Add to Home
            screen.”
          </p>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="min-h-11 w-full rounded-xl border border-line px-4 text-[13px] font-semibold text-inksoft transition hover:bg-cream"
        >
          Not now
        </button>
      </div>
    </Modal>
  );
}
