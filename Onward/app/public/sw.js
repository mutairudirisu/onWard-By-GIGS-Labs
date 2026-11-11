const CACHE = "onward-shell-v1";
const SHELL = ["/", "/today", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  // No skipWaiting here: a new bundle stays in the wings until the page asks
  // for it, which is what makes the "update available" prompt meaningful.
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/today")))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});

// Push payloads are delivered by the server while the PWA is closed.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "onWard reminder", body: "You have a reminder." };
  }
  const kind = payload.kind;
  const options = {
    body: payload.body || "You have a reminder.",
    icon: "/icons/icon-512.png",
    badge: "/icons/icon-maskable.svg",
    tag: payload.tag || `onward-${Date.now()}`,
    renotify: false,
    data: {
      href: payload.href || "/today",
      kind,
      title: payload.focusTitle,
      durationMinutes: payload.durationMinutes,
      scheduledAt: payload.scheduledAt,
      scheduleId: payload.scheduleId,
      tag: payload.tag,
    },
  };
  const scheduledAt = Date.parse(payload.scheduledAt || "");
  const startIsCurrent =
    !Number.isFinite(scheduledAt) || Date.now() - scheduledAt < 30 * 60 * 1000;
  if (kind === "focus" && startIsCurrent) {
    options.actions = [{ action: "start", title: "Start focus" }];
  }
  event.waitUntil(self.registration.showNotification(payload.title || "onWard reminder", options));
});

// Tapping an alert opens the screen it came from.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const startFocus = event.action === "start" && data.kind === "focus";
  const scheduledAt = Date.parse(data.scheduledAt || "");
  const mayStart = startFocus && (!Number.isFinite(scheduledAt) || Date.now() - scheduledAt < 30 * 60 * 1000);
  const target = new URL(data.href || "/today", self.location.origin);
  if (data.kind === "focus" && data.scheduleId) {
    target.searchParams.set("focusSchedule", String(data.scheduleId));
  }
  if (mayStart) {
    target.searchParams.set("startFocus", "1");
    target.searchParams.set("duration", String(data.durationMinutes || ""));
    target.searchParams.set("title", String(data.title || ""));
  } else target.searchParams.delete("startFocus");
  const href = `${target.pathname}${target.search}${target.hash}`;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const open = windows.find((w) => "focus" in w);
        if (open) {
          return open.navigate(href).then(() => {
            if (mayStart) {
              open.postMessage({
                type: "START_FOCUS",
                scheduleId: data.scheduleId,
                durationMinutes: Number(data.durationMinutes),
              });
            }
            return open.focus();
          });
        }
        return self.clients.openWindow(href);
      })
  );
});
