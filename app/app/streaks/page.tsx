"use client";

import Link from "next/link";
import { useMemo } from "react";
import { HeatLegend, HeatMap } from "@/components/widgets/heat-map";
import { PhoneShell } from "@/components/layout/phone-shell";
import { ShareButton } from "@/components/overlays/share-button";
import { BackLink } from "@/components/ui/ui";
import { useAuth } from "@/components/providers/auth";
import { useActivity, bestWeekday, heatmapFrom } from "@/lib/activity";
import { formatMedium } from "@/lib/dates";
import { CalendarHeart, Flame, Medal, Sprout } from "lucide-react";

const MILESTONES = [
  { days: 7, label: "First week" },
  { days: 30, label: "One month" },
  { days: 50, label: "Fifty strong" },
  { days: 100, label: "Century" },
];

export default function StreaksPage() {
  const { user } = useAuth();
  const { days, streak, loaded } = useActivity();
  const grid = useMemo(() => heatmapFrom(days), [days]);
  const joined = user?.created_at
    ? formatMedium(user.created_at.slice(0, 10))
    : "—";

  const shareText = `I'm on a ${streak.current}-day onWard streak — ${streak.daysUsing} days of showing up and turning small steps into progress.`;

  return (
    <PhoneShell tab="you">
      <div className="mb-1 flex items-center gap-1">
        <BackLink href="/profile" label="Back to profile" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Your streaks</h1>
      </div>
      <p className="tiny mb-4">How far you&apos;ve come — one small step at a time.</p>

      <section className="mb-3 flex items-center gap-4 rounded-2xl bg-panel px-4 py-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2B2C24]">
          <Flame className="h-7 w-7 text-lime" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[26px] font-bold leading-none tracking-tight text-on-panel">
            {streak.current}
            <span className="ml-1 text-[12px] font-semibold text-[#A9AAA0]">days</span>
          </p>
          <p className="mt-1.5 text-[10px] leading-[1.5] text-[#A9AAA0]">
            Current streak · longest {streak.longest} days
          </p>
        </div>
        <ShareButton
          text={shareText}
          label=""
          className="flex h-8 w-8 items-center justify-center rounded-full bg-panel-soft text-on-panel hover:bg-[#34352C]"
        />
      </section>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { icon: Sprout, value: `${streak.daysUsing}`, label: "days on onWard" },
          { icon: CalendarHeart, value: `${days.length}`, label: "active days" },
          { icon: Medal, value: bestWeekday(days), label: "best day" },
        ].map((s) => (
          <div key={s.label} className="card px-3 py-3 text-center">
            <s.icon className="mx-auto h-4 w-4 text-inksoft" strokeWidth={2} />
            <p className="mt-1.5 text-[15px] font-bold leading-none tracking-tight text-ink">
              {s.value}
            </p>
            <p className="mt-1 text-[9px] font-medium text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="card mb-3 px-4 py-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[12px] font-bold tracking-tight text-ink">Last 6 months</h2>
          <span className="text-[9px] text-muted">since {joined}</span>
        </div>
        <HeatMap cell={12} cells={grid} />
        <div className="mt-2.5 flex items-center justify-between">
          <p className="text-[9px] text-muted">
            {loaded && streak.daysUsing === 0
              ? "Your first onWard fills a square."
              : "Every square is a day you showed up."}
          </p>
          <HeatLegend />
        </div>
      </section>

      <section className="card px-4 py-3.5">
        <h2 className="mb-3 text-[12px] font-bold tracking-tight text-ink">Milestones</h2>
        <div className="space-y-3">
          {MILESTONES.map((m) => {
            const done = streak.longest >= m.days;
            return (
              <div key={m.label} className="flex items-center gap-3">
                <span
                  className={
                    done
                      ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-soft text-[10px] font-bold text-ink"
                      : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dash text-[10px] font-semibold text-faint"
                  }
                >
                  {done ? "✓" : m.days}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-semibold text-ink">{m.label}</span>
                  <span className="block text-[9px] text-muted">
                    {done ? `Reached at ${m.days} days` : `${Math.max(0, m.days - streak.longest)} days to go`}
                  </span>
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime text-[10px] font-bold text-dark">
              {streak.current}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-semibold text-ink">Current streak</span>
              <span className="block text-[9px] text-muted">
                {streak.current > 0 ? "Keep it warm today." : "Complete one thing to start today."}
              </span>
            </span>
            <span className="rounded-full bg-lime px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-dark">
              Now
            </span>
          </div>
        </div>
      </section>

      <div className="mt-4 flex gap-2.5">
        <Link
          href="/leaderboard"
          className="card flex flex-1 items-center justify-center gap-2 px-3.5 py-3 text-[11.5px] font-semibold text-ink"
        >
          <Medal className="h-4 w-4 text-inksoft" /> See leaderboard
        </Link>
        <ShareButton
          text={shareText}
          label="Share streak"
          className="card flex flex-1 items-center justify-center gap-2 px-3.5 py-3 text-[11.5px] font-semibold text-ink"
        />
      </div>
    </PhoneShell>
  );
}
