"use client";

import { useEffect, useState } from "react";
import { Check, Download, Share, Smartphone } from "lucide-react";
import { Modal } from "@/components/modal";

type BIPEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };
const INSTALL_PROMPT_KEY = "onward.install-prompt-dismissed.v1";

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const standalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    if (standalone) setInstalled(true);

    const ua = navigator.userAgent || "";
    const isIos = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && "ontouchend" in document);
    setIos(isIos && !standalone);
    setChecked(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } finally {
      setDeferred(null);
    }
  }

  return { canInstall: !!deferred, installed, ios, checked, promptInstall };
}

export function InstallPromptOnVisit() {
  const { canInstall, installed, ios, checked, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [installError, setInstallError] = useState("");

  useEffect(() => {
    if (!checked) return;
    if (installed) {
      setOpen(false);
      return;
    }

    try {
      if (window.localStorage.getItem(INSTALL_PROMPT_KEY) !== "dismissed") {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, [checked, installed]);

  function dismiss() {
    try {
      window.localStorage.setItem(INSTALL_PROMPT_KEY, "dismissed");
    } catch {
      // Keep the prompt usable for this visit if storage is unavailable.
    }
    setOpen(false);
  }

  async function install() {
    try {
      await promptInstall();
      dismiss();
    } catch {
      setInstallError("Installation could not be opened. Try your browser’s menu instead.");
    }
  }

  return (
    <Modal open={open && !installed} onClose={dismiss} title="Take onWard with you">
      <div className="space-y-4 pt-2">
        <p className="text-[13px] leading-relaxed text-inksoft">
          Add onWard to your Home Screen for a quicker, app-like way to plan,
          capture progress, and stay connected.
        </p>

        {ios ? (
          <div className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-[12px] font-bold text-ink">Install on iPhone or iPad</p>
            <ol className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-inksoft">
              <li className="flex items-start gap-2">
                <Share className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep" />
                In Safari, tap the Share button.
              </li>
              <li>Choose “Add to Home Screen” from the share sheet.</li>
              <li>Tap “Add” to finish. onWard will appear with your apps.</li>
            </ol>
          </div>
        ) : canInstall ? (
          <p className="rounded-2xl border border-line bg-cream p-4 text-[12px] leading-relaxed text-inksoft">
            Your browser supports installing onWard. You can remove it from your
            Home Screen or apps list at any time.
          </p>
        ) : (
          <p className="rounded-2xl border border-line bg-cream p-4 text-[12px] leading-relaxed text-inksoft">
            Open your browser menu and choose “Install onWard” or “Add to Home
            Screen.” If that option is missing, try Safari on iPhone or Chrome
            on Android.
          </p>
        )}

        {installError ? (
          <p role="alert" className="text-[12px] font-semibold text-red-700">
            {installError}
          </p>
        ) : null}

        <div className="flex gap-2">
          {canInstall ? (
            <button
              type="button"
              onClick={() => void install()}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-[13px] font-bold text-paper transition hover:bg-dark"
            >
              <Download className="h-4 w-4" />
              Install onWard
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="min-h-11 flex-1 rounded-xl bg-ink px-4 text-[13px] font-bold text-paper transition hover:bg-dark"
            >
              Got it
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="min-h-11 rounded-xl border border-line px-4 text-[13px] font-semibold text-inksoft transition hover:bg-cream"
          >
            Not now
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function InstallButton({
  label = "Install onWard",
  className = "",
  icon = true,
}: {
  label?: string;
  className?: string;
  icon?: boolean;
}) {
  const { canInstall, installed, ios, promptInstall } = useInstallPrompt();

  if (installed) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {icon ? <Check className="h-4 w-4 shrink-0" /> : null}
        <span>onWard is installed</span>
      </span>
    );
  }

  if (canInstall) {
    return (
      <button type="button" onClick={promptInstall} className={`inline-flex items-center gap-2 ${className}`}>
        {icon ? <Download className="h-4 w-4 shrink-0" /> : null}
        <span>{label}</span>
      </button>
    );
  }

  if (ios) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {icon ? <Smartphone className="h-4 w-4 shrink-0" /> : null}
        <span>Tap Share, then “Add to Home Screen”</span>
      </span>
    );
  }

  // Not yet installable (e.g. not served over HTTPS yet, or prompt not fired):
  // still give a clear, honest affordance.
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {icon ? <Download className="h-4 w-4 shrink-0" /> : null}
      <span>{label}</span>
    </span>
  );
}
