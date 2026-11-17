"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink } from "@/components/ui";
import { useNotifications } from "@/components/notifications";
import type { AppNotice, NoticeKind } from "@/lib/notices";
import {
  Bell,
  BellRing,
  CheckCheck,
  Flame,
  MessageCircle,
  Sparkles,
  Sprout,
} from "lucide-react";

const ICONS: Record<NoticeKind, typeof Bell> = {
  streak: Flame,
  win: Sprout,
  welcome: Sparkles,
  message: MessageCircle,
};

function when(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function NoticeRow({ notice, unread }: { notice: AppNotice; unread: boolean }) {
  const { markRead } = useNotifications();
  const Icon = ICONS[notice.kind] ?? Bell;
  const inner = (
    <>
      <span
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          unread ? "bg-lime text-dark" : "bg-cream text-inksoft"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-bold text-ink">{notice.title}</span>
          {unread ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" /> : null}
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-[1.5] text-inksoft">{notice.body}</span>
        <span className="mt-1 block text-[10px] font-medium text-muted">{when(notice.at)}</span>
      </span>
    </>
  );

  const className = `flex items-start gap-3 px-4 py-3.5 transition hover:bg-cream lg:px-5 ${
    unread ? "bg-lime-pale/60" : ""
  }`;

  return notice.href ? (
    <Link href={notice.href} onClick={() => markRead(notice.id)} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={() => markRead(notice.id)} className={`${className} w-full text-left`}>
      {inner}
    </button>
  );
}

export default function NotificationsPage() {
  const { items, unreadIds, ready, permission, alertsOn, markAllRead, enableAlerts } =
    useNotifications();

  // Whatever was unread on arrival stays lit while you read; leaving the inbox clears the dot.
  const [arrived, setArrived] = useState<string[] | null>(null);
  useEffect(() => {
    if (ready && arrived === null) setArrived(unreadIds);
  }, [arrived, ready, unreadIds]);

  const clear = useRef(markAllRead);
  clear.current = markAllRead;
  useEffect(() => () => clear.current(), []);

  const lit = new Set(arrived ?? []);

  return (
    <PhoneShell tab="you">
      <div className="mb-1 flex items-center gap-1">
        <BackLink href="/today" label="Back to today" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Notifications</h1>
      </div>
      <p className="tiny mb-4">Streak nudges and the wins you just captured.</p>

      {permission !== "granted" ? (
        <section className="card mb-4 flex items-start gap-3 px-4 py-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-soft text-ink">
            <Bell className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-ink">
              {permission === "denied" ? "Alerts are blocked by your browser" : "Turn on alerts"}
            </p>
            <p className="mt-0.5 text-[11px] leading-[1.5] text-muted">
              {permission === "denied"
                ? "Allow notifications for this site in your browser settings, then reopen onWard."
                : "Get a buzz when onWard saves something worth your attention."}
            </p>
            {permission === "default" ? (
              <button
                type="button"
                onClick={() => void enableAlerts()}
                className="mt-2.5 rounded-full bg-lime px-3.5 py-1.5 text-[11px] font-bold text-dark transition hover:bg-lime-deep"
              >
                Allow notifications
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <p className="mb-4 flex items-center gap-1.5 text-[10.5px] font-semibold text-lime-deep">
          <BellRing className="h-3.5 w-3.5" />
          {alertsOn ? "Alerts are on. You will hear when something lands here." : "Alerts allowed, but muted in Settings."}
        </p>
      )}

      {items.length === 0 ? (
        <div className="card px-4 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream text-inksoft">
            <Bell className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[12.5px] font-semibold text-ink">Nothing needs your attention</p>
          <p className="tiny mt-1">
            Every onWard you save lands here, and a streak nudge shows up when the run is going.
          </p>
        </div>
      ) : (
        <section className="card divide-y divide-line overflow-hidden">
          {items.map((notice) => (
            <NoticeRow key={notice.id} notice={notice} unread={lit.has(notice.id)} />
          ))}
        </section>
      )}

      {items.length > 0 ? (
        <button
          type="button"
          onClick={markAllRead}
          className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-muted hover:text-ink"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark everything read
        </button>
      ) : null}
    </PhoneShell>
  );
}
