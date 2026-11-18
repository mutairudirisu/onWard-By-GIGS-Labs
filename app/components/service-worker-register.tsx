"use client";

import { useEffect } from "react";
import { setWaitingWorker } from "@/lib/app-update";

/** Ask the browser for a new sw.js now; a no-op when nothing changed. */
function checkForUpdate(registration: ServiceWorkerRegistration) {
  void registration.update().catch(() => {});
}

function watchForWaiting(registration: ServiceWorkerRegistration) {
  if (registration.waiting) setWaitingWorker(registration.waiting);
  registration.addEventListener("updatefound", () => {
    const next = registration.installing;
    if (!next) return;
    next.addEventListener("statechange", () => {
      // Only an update is interesting: the very first install has no active
      // worker to replace, and there is nothing to reload yet.
      if (next.state === "installed" && registration.active) {
        setWaitingWorker(next);
      }
    });
  });
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      // An installed PWA can sit open for days, so poll for a new bundle on a
      // timer and whenever the window comes back into view.
      let registration: ServiceWorkerRegistration | null = null;
      let timer: ReturnType<typeof setInterval> | null = null;
      const onVisible = () => {
        if (registration && document.visibilityState === "visible") checkForUpdate(registration);
      };
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          registration = reg;
          watchForWaiting(reg);
          timer = setInterval(() => checkForUpdate(reg), 30 * 60 * 1000);
          document.addEventListener("visibilitychange", onVisible);
        })
        .catch(() => {});
      return () => {
        if (timer !== null) clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }

    // In dev, webpack chunk URLs are stable (not content-hashed), so a cached
    // service worker serves stale JS and breaks module loading with
    // "Cannot read properties of undefined (reading 'call')". Remove any
    // leftover worker and its cache so the dev server always wins.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});

    if (typeof caches !== "undefined") {
      caches
        .keys()
        .then((keys) =>
          Promise.all(keys.filter((k) => k.startsWith("onward-")).map((k) => caches.delete(k))),
        )
        .catch(() => {});
    }
  }, []);

  return null;
}
