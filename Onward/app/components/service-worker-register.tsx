"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
      return;
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
