"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share } from "lucide-react";
import { Modal } from "@/components/modal";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallFromLink() {
  const installIntent = useRef(false);
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installError, setInstallError] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("install") !== "1") return;
    installIntent.current = true;

    url.searchParams.delete("install");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const userAgent = window.navigator.userAgent || "";
    setIos(
      /iphone|ipad|ipod/i.test(userAgent) ||
        (/macintosh/i.test(userAgent) && "ontouchend" in document),
    );
    setChecking(true);
    setOpen(true);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (!installIntent.current) return;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setChecking(false);
      setInstallError("");
    };
    const onInstalled = () => {
      installIntent.current = false;
      setOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const timeout = window.setTimeout(() => setChecking(false), 1500);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    installIntent.current = false;
    setOpen(false);
  }

  async function install() {
    if (!deferredPrompt) {
      setInstallError(
        ios
          ? "Safari requires installing from the Share menu using “Add to Home Screen.”"
          : "This browser has not offered a direct install prompt. Use the browser menu and choose “Install app” or “Add to Home screen.”",
      );
      return;
    }

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setOpen(false);
    } catch {
      setInstallError("The install prompt could not be opened. Try your browser menu instead.");
    }
  }

  return (
    <Modal open={open} onClose={dismiss} title="Install onWard">
      <div className="space-y-4 pt-2">
        <p className="text-[13px] leading-relaxed text-inksoft">
          Install onWard for a quicker, app-like way to plan, capture progress, and stay connected.
        </p>

        {checking ? (
          <p
            role="status"
            className="rounded-2xl border border-line bg-cream p-4 text-[12px] text-inksoft"
          >
            Checking whether this browser can install onWard…
          </p>
        ) : ios ? (
          <div className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-[12px] font-bold text-ink">Install on iPhone or iPad</p>
            <p className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-inksoft">
              <Share className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep" />
              In Safari, tap Share, choose “Add to Home Screen,” then tap “Add.”
            </p>
          </div>
        ) : (
          <p className="rounded-2xl border border-line bg-cream p-4 text-[12px] leading-relaxed text-inksoft">
            Open your browser menu and choose “Install app” or “Add to Home screen.”
          </p>
        )}

        <button
          type="button"
          onClick={() => void install()}
          disabled={checking}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 text-[13px] font-bold text-dark transition hover:bg-lime-deep disabled:cursor-wait disabled:opacity-70"
        >
          <Download className="h-4 w-4" />
          Install app
        </button>

        {installError ? (
          <p role="alert" className="text-[12px] font-semibold text-red-700">
            {installError}
          </p>
        ) : null}

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
