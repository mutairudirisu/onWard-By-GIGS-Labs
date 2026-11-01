"use client";

type Listener = () => void;

// The service worker that finished installing but is still waiting for the
// page to hand over. Non-null means the bundle on disk is newer than this one.
let waitingWorker: ServiceWorker | null = null;
const listeners = new Set<Listener>();

export function hasUpdateWaiting() {
  return waitingWorker !== null;
}

export function setWaitingWorker(worker: ServiceWorker | null) {
  if (worker === waitingWorker) return;
  waitingWorker = worker;
  for (const listener of Array.from(listeners)) listener();
}

export function subscribeToWaitingWorker(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reloadWithUpdate() {
  waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  window.location.reload();
}
