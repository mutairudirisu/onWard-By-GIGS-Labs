"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/layout/phone-shell";
import { DateStrip } from "@/components/widgets/date-strip";
import { Avatar } from "@/components/feed/feed-post";
import { HomeWidgets } from "@/components/widgets/home-widgets";
import { Button } from "@/components/ui/ui";
import { useStore } from "@/components/providers/store";
import { useCurrentUser } from "@/components/providers/auth";
import { useNotifications } from "@/components/providers/notifications";
import type { OnWard } from "@/lib/data";
import { formatLong } from "@/lib/dates";
import { Bell, ChevronRight, Plus, Sprout } from "lucide-react";

/** One logged ward, as a line in the day's record. */
function WardLine({ ward }: { ward: OnWard }) {
  return (
    <Link
      href={`/onwards/${ward.id}`}
      className="flex items-start gap-3 py-3 transition hover:bg-cream"
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-soft text-inksoft">
        <Sprout className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-bold tracking-tight text-ink [overflow-wrap:anywhere] lg:text-[14px]">
          {ward.title}
        </span>
        {ward.impact ? (
          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-[1.55] text-muted [overflow-wrap:anywhere]">
            {ward.impact}
          </span>
        ) : null}
        {ward.skills.length ? (
          <span className="mt-1 block truncate text-[10px] font-semibold text-inksoft">
            {ward.skills.slice(0, 3).join(" · ")}
          </span>
        ) : null}
      </span>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-faint" />
    </Link>
  );
}

export default function TodayPage() {
  const { onWards, selectedDate, wardsThisMonth, limits } = useStore();
  const user = useCurrentUser();
  const { unread } = useNotifications();
  const firstName = user.name.split(" ")[0] || "there";

  const dayWards = onWards.filter((w) => w.date === selectedDate);
  const cap = limits.wardsPerMonth;

  return (
    <PhoneShell tab="today" wide>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-x-8">
        <div className="mb-4 lg:col-span-2 lg:mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted lg:text-[11px]">
            {formatLong(selectedDate)}
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <h1 className="text-[22px] font-bold tracking-tight text-ink lg:text-[32px]">
              Hi, {firstName}.
            </h1>
            <div className="flex items-center gap-2">
              <Link
                href="/notifications"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                className="relative flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-paper px-3 text-muted transition hover:bg-lime-pale"
              >
                <span className="relative flex">
                  <Bell className="h-[18px] w-[18px]" />
                  {unread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-paper" />
                  ) : null}
                </span>
                {unread > 0 ? (
                  <span className="text-[11px] font-medium tabular-nums text-muted">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/profile"
                aria-label="Your profile"
                className="flex cursor-pointer items-center justify-center rounded-full"
              >
                <Avatar initials={user.initials} src={user.avatarUrl} size="compact" />
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-start-1">
          <DateStrip />

          <HomeWidgets />

          <section className="mt-4">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
                {dayWards.length ? "Logged this day" : "Proof from this day"}
              </h2>
              <span className="h-px flex-1 bg-line" />
              <Link
                href="/onwards"
                className="text-[10px] font-semibold text-muted underline lg:text-[12px]"
              >
                All onWards
              </Link>
            </div>

            {dayWards.length ? (
              <div className="card divide-y divide-line px-3.5">
                {dayWards.map((ward) => (
                  <WardLine key={ward.id} ward={ward} />
                ))}
              </div>
            ) : (
              <div className="card px-4 py-5 text-center">
                <p className="text-[12px] font-semibold text-ink">
                  Nothing captured for this day yet
                </p>
                <p className="mt-1 text-[10.5px] leading-[1.6] text-muted">
                  A win, a lesson, a milestone or a piece of feedback takes under a minute
                  now, and is proof later.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="mt-6 space-y-4 lg:col-start-2 lg:mt-0">
          <section>
            <p className="mb-2 text-[10px] text-muted lg:text-[12px]">
              Got something worth remembering?
            </p>
            <Button href="/onwards/new" iconLeft={<Plus className="h-4 w-4" strokeWidth={2.4} />}>
              Log an onWard
            </Button>
          </section>

          <section className="card px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              This month
            </p>
            <p className="mt-1 text-[28px] font-bold leading-none tracking-tight text-ink">
              {wardsThisMonth}
            </p>
            <p className="mt-1.5 text-[10.5px] text-muted">
              {cap == null
                ? "onWards captured, nothing capped on Pro."
                : `${Math.min(wardsThisMonth, cap)} of ${cap} free captures used.`}
            </p>
          </section>

          <section className="rounded-2xl bg-panel px-5 py-4 text-on-panel">
            <h3 className="text-[12px] font-bold">Write it down before it blurs</h3>
            <p className="mt-1 text-[11px] leading-[1.55] text-[#B7B8AC]">
              The numbers and names you cannot recall next quarter are the ones a review or
              a CV needs.
            </p>
          </section>
        </aside>
      </div>
    </PhoneShell>
  );
}
