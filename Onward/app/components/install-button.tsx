"use client";

import { useEffect, useState } from "react";
import { Check, Download, Smartphone } from "lucide-react";

type BIPEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

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

  return { canInstall: !!deferred, installed, ios, promptInstall };
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
