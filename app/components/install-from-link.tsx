"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Modal } from "@/components/modal";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallCaptureState = {
  requested: boolean;
  installed: boolean;
  prompt: BeforeInstallPromptEvent | null;
};

declare global {
  interface Window {
    __onWardInstallState?: InstallCaptureState;
  }
}

export function InstallFromLink() {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installNotice, setInstallNotice] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const installRequested = url.searchParams.get("install") === "1";
    let capture = window.__onWardInstallState;
    if (!capture && installRequested) {
      capture = { requested: true, installed: false, prompt: null };
      window.__onWardInstallState = capture;
    }
    if (!capture?.requested) return;

    if (installRequested) {
      url.searchParams.delete("install");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || capture.installed) {
      capture.requested = false;
      setInstalled(true);
      return;
    }

    const userAgent = window.navigator.userAgent || "";
    setIos(
      /iphone|ipad|ipod/i.test(userAgent) ||
        (/macintosh/i.test(userAgent) && "ontouchend" in document),
    );
    setChecking(true);
    setOpen(true);

    const syncPrompt = () => {
      if (!capture?.prompt || !capture.requested) return;
      setDeferredPrompt(capture.prompt);
      setChecking(false);
      setInstallNotice("");
    };
    const onInstalled = () => {
      if (capture) {
        capture.installed = true;
        capture.requested = false;
        capture.prompt = null;
      }
      setInstalled(true);
      setDeferredPrompt(null);
      setOpen(false);
    };

    window.addEventListener("onwardinstallpromptready", syncPrompt);
    window.addEventListener("onwardappinstalled", onInstalled);
    window.addEventListener("appinstalled", onInstalled);
    syncPrompt();
    const timeout = window.setTimeout(() => setChecking(false), 2500);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("onwardinstallpromptready", syncPrompt);
      window.removeEventListener("onwardappinstalled", onInstalled);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    const capture = window.__onWardInstallState;
    if (capture) {
      capture.requested = false;
      capture.prompt = null;
    }
    setDeferredPrompt(null);
    setOpen(false);
  }

  async function install() {
    if (!deferredPrompt) {
      setInstallNotice(
        ios
          ? "Follow the iPhone or iPad steps above to add onWard."
          : "Use the browser menu steps above to add onWard.",
      );
      return;
    }

    const prompt = deferredPrompt;
    setDeferredPrompt(null);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      const capture = window.__onWardInstallState;
      if (capture) {
        capture.prompt = null;
        if (outcome === "accepted") {
          capture.installed = true;
          capture.requested = false;
        }
      }
      if (outcome === "accepted") setInstalled(true);
      setOpen(false);
    } catch {
      const capture = window.__onWardInstallState;
      if (capture) capture.prompt = null;
      setInstallNotice("The browser could not open its install dialog. Use the browser menu instead.");
    }
  }

  if (installed) return null;

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
        ) : deferredPrompt ? (
          <p className="rounded-2xl border border-line bg-cream p-4 text-[12px] text-inksoft">
            Your browser can install onWard. Continue to open its install dialog.
          </p>
        ) : ios ? (
          <div className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-[12px] font-bold text-ink">Install on iPhone or iPad</p>
            <p className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-inksoft">
              <Share className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep" />
              Tap Share, choose “Add to Home Screen,” then tap “Add.”
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
          {checking ? "Checking…" : deferredPrompt ? "Install app" : "How to install"}
        </button>

        {installNotice ? (
          <p role="status" className="text-[12px] font-semibold text-inksoft">
            {installNotice}
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
