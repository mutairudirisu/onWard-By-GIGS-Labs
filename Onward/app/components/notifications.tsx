"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./auth";
import { useStore } from "./store";
import { useActivity } from "@/lib/activity";
import { formatMedium, toISO } from "@/lib/dates";
import { NOTICE_EVENT, type AppNotice, type NoticeInput } from "@/lib/notices";

const FEED_KEY = "onward.notices.v1";
const READ_KEY = "onward.notices.read.v1";
const MAX_STORED = 30;
const MAX_FEED = 40;
const DAY_MS = 24 * 60 * 60 * 1000;

type AlertPermission = "unsupported" | "default" | "granted" | "denied";

type NotificationsValue = {
  items: AppNotice[];
  unread: number;
  unreadIds: string[];
  ready: boolean;
  permission: AlertPermission;
  alertsOn: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  enableAlerts: () => Promise<AlertPermission>;
};

const Ctx = createContext<NotificationsValue | null>(null);

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readStored(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or quota — the feed simply rebuilds next session */
  }
}

function currentPermission(): AlertPermission {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.permission as AlertPermission;
}

/** Reminders, streak nudges and the welcome note the user never has to create. */
function derivedNotices(
  tasks: { id: string; title: string; time?: string; date?: string; done: boolean; archived?: boolean }[],
  streakCurrent: number,
  signedUpAt: string | null,
): AppNotice[] {
  const today = toISO(new Date());
  const out: AppNotice[] = [];

  for (const task of tasks) {
    if (task.archived || !task.time || !task.date || task.date < today) continue;
    const at = new Date(`${task.date}T${task.time}:00`);
    if (Number.isNaN(at.getTime())) continue;
    out.push({
      id: `reminder-${task.id}`,
      kind: "reminder",
      title: `Reminder · ${task.title}`,
      body: `${formatMedium(task.date)} at ${task.time}`,
      href: `/tasks/${task.id}`,
      at: at.toISOString(),
    });
  }

  if (streakCurrent >= 2) {
    out.push({
      id: `streak-${today}`,
      kind: "streak",
      title: `${streakCurrent}-day streak running`,
      body: "One task, note or onWard today keeps the run alive.",
      href: "/streaks",
      at: new Date(`${today}T08:00:00`).toISOString(),
    });
  }

  if (signedUpAt) {
    out.push({
      id: "welcome",
      kind: "welcome",
      title: "Welcome to onWard",
      body: "Everything you log becomes evidence of your progress.",
      href: "/profile",
      at: signedUpAt,
    });
  }

  return out;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { tasks, settings } = useStore();
  const { streak } = useActivity();
  const userId = user?.id ?? null;

  const [stored, setStored] = useState<AppNotice[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [permission, setPermission] = useState<AlertPermission>("unsupported");

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const permissionRef = useRef<AlertPermission>("unsupported");
  const firedRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<number[]>([]);

  const showAlert = useCallback((notice: Omit<AppNotice, "at">) => {
    if (permissionRef.current !== "granted" || !settingsRef.current.notifications) return;
    if (typeof Notification === "undefined") return;
    const options: NotificationOptions & { data?: { href?: string } } = {
      body: notice.body,
      icon: "/icons/icon-512.png",
      badge: "/icons/icon-maskable.svg",
      tag: notice.id,
      data: { href: notice.href },
    };
    const direct = () => {
      try {
        new Notification(notice.title, options);
      } catch {
        /* Android Chrome only allows notifications from the service worker */
      }
    };
    navigator.serviceWorker
      ?.getRegistration()
      .then((registration) => (registration ? registration.showNotification(notice.title, options) : direct()))
      .catch(direct);
  }, []);

  useEffect(() => {
    setPermission(currentPermission());
    permissionRef.current = currentPermission();
  }, []);

  useEffect(() => {
    if (!userId) {
      setStored([]);
      setReadIds([]);
      setReady(true);
      return;
    }
    const feed = readStored(`${FEED_KEY}:${userId}`);
    const read = readStored(`${READ_KEY}:${userId}`);
    setStored(Array.isArray(feed) ? (feed as AppNotice[]) : []);
    setReadIds(Array.isArray(read) ? (read as string[]) : []);
    setReady(true);
  }, [userId]);

  const persist = useCallback(
    (next: AppNotice[]) => {
      setStored(next);
      if (userId) writeStored(`${FEED_KEY}:${userId}`, next);
    },
    [userId],
  );

  // Anything the app wants announced: a task ticked off, a win captured.
  useEffect(() => {
    const onNotice = (event: Event) => {
      const input = (event as CustomEvent<NoticeInput>).detail;
      if (!input) return;
      const notice: AppNotice = {
        ...input,
        id: input.id ?? uid(),
        at: input.at ?? new Date().toISOString(),
      };
      setReadIds((prev) => prev.filter((id) => id !== notice.id));
      setStored((prev) => {
        const next = [notice, ...prev.filter((n) => n.id !== notice.id)].slice(0, MAX_STORED);
        if (userId) writeStored(`${FEED_KEY}:${userId}`, next);
        return next;
      });
      showAlert(notice);
    };
    window.addEventListener(NOTICE_EVENT, onNotice);
    return () => window.removeEventListener(NOTICE_EVENT, onNotice);
  }, [showAlert, userId]);

  const items = useMemo(() => {
    const derived = userId
      ? derivedNotices(tasks, streak.current, user?.created_at ?? null)
      : [];
    const seen = new Set<string>();
    const merged: AppNotice[] = [];
    for (const notice of [...derived, ...stored]) {
      if (seen.has(notice.id)) continue;
      seen.add(notice.id);
      merged.push(notice);
    }
    return merged
      .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
      .slice(0, MAX_FEED);
  }, [stored, tasks, streak.current, user?.created_at, userId]);

  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const unreadIds = useMemo(
    () => items.filter((n) => !readSet.has(n.id)).map((n) => n.id),
    [items, readSet],
  );
  const unread = unreadIds.length;

  const persistRead = useCallback(
    (next: string[]) => {
      setReadIds(next);
      if (userId) writeStored(`${READ_KEY}:${userId}`, next);
    },
    [userId],
  );

  const markRead = useCallback(
    (id: string) => {
      if (readIds.includes(id)) return;
      persistRead([...readIds, id]);
    },
    [persistRead, readIds],
  );

  const markAllRead = useCallback(() => {
    persistRead([...new Set([...readIds, ...items.map((n) => n.id)])]);
  }, [items, persistRead, readIds]);

  // The installed app icon carries the same count as the in-app red dot.
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (typeof nav.setAppBadge !== "function") return;
    const apply = unread > 0 ? nav.setAppBadge(unread) : nav.clearAppBadge?.();
    void apply?.catch(() => {
      /* badge support is optional */
    });
  }, [unread]);

  // Fire browser alerts for reminders still ahead of us today.
  useEffect(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (permission !== "granted" || !settings.notifications) return;
    const now = Date.now();
    for (const notice of items) {
      if (notice.kind !== "reminder" || firedRef.current.has(notice.id)) continue;
      const delay = new Date(notice.at).getTime() - now;
      if (delay < 0 || delay > DAY_MS) continue;
      const timer = window.setTimeout(() => {
        firedRef.current.add(notice.id);
        showAlert(notice);
      }, delay);
      timersRef.current.push(timer);
    }
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [items, permission, settings.notifications, showAlert]);

  const enableAlerts = useCallback(async () => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      permissionRef.current = "unsupported";
      return "unsupported" as AlertPermission;
    }
    const next = (await Notification.requestPermission()) as AlertPermission;
    setPermission(next);
    permissionRef.current = next;
    if (next === "granted") {
      showAlert({
        id: `test-${uid()}`,
        kind: "welcome",
        title: "Alerts are on",
        body: "Reminders will buzz while onWard is open.",
      });
    }
    return next;
  }, [showAlert]);

  const value = useMemo<NotificationsValue>(
    () => ({
      items,
      unread,
      unreadIds,
      ready,
      permission,
      alertsOn: permission === "granted" && settings.notifications,
      markRead,
      markAllRead,
      enableAlerts,
    }),
    [items, unread, unreadIds, ready, permission, settings.notifications, markRead, markAllRead, enableAlerts],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationsProvider>");
  return ctx;
}

/** Red dot pinned to the corner of an avatar or icon that sits in a relative box. */
export function UnreadDot() {
  const { unread } = useNotifications();
  if (unread === 0) return null;
  return (
    <span
      aria-label={`${unread} unread notification${unread === 1 ? "" : "s"}`}
      className="absolute -right-0.5 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
    />
  );
}
