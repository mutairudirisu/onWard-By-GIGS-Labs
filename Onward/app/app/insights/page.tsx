"use client";

import { useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, Chip } from "@/components/ui";
import { insightBars, skillUsage } from "@/lib/data";
import { Sprout } from "lucide-react";

const RANGES = ["This week", "This month", "All time"];

export default function InsightsPage() {
  const [range, setRange] = useState("This month");

  return (
    <PhoneShell tab="you">
      <div className="mb-1 flex items-center gap-1">
        <BackLink href="/profile" label="Back to profile" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Your insights</h1>
      </div>
      <p className="tiny mb-4">A calm look at how your progress is accumulating.</p>

      <div className="mb-4 flex gap-2">
        {RANGES.map((r) => (
          <Chip key={r} active={range === r} onClick={() => setRange(r)}>
            {r}
          </Chip>
        ))}
      </div>

      <div className="mb-2 flex items-end justify-between">
        <h2 className="text-[13px] font-bold tracking-tight text-ink">October 2026</h2>
        <span className="text-[10px] font-semibold text-muted">7 onWards logged</span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="card px-3.5 py-3">
          <p className="text-[20px] font-bold leading-none tracking-tight text-ink">7</p>
          <p className="mt-1 text-[10px] font-semibold text-inksoft">onWards logged</p>
          <p className="mt-0.5 text-[9px] text-muted">October&apos;s target: 6</p>
        </div>
        <div className="card px-3.5 py-3">
          <p className="text-[20px] font-bold leading-none tracking-tight text-ink">24.5h</p>
          <p className="mt-1 text-[10px] font-semibold text-inksoft">Work documented</p>
          <p className="mt-0.5 text-[9px] text-muted">Across 3 projects</p>
        </div>
      </div>

      <section className="card mb-3 px-4 py-3.5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[12px] font-bold tracking-tight text-ink">
              Streaky steps forward
            </h3>
            <p className="mt-0.5 text-[9px] text-muted">Tasks completed · 30 days</p>
          </div>
          <span className="text-[18px] font-bold tracking-tight text-ink">18</span>
        </div>
        <div className="mt-4 flex h-20 items-end justify-between gap-2">
          {insightBars.map((bar) => (
            <span key={bar.label} className="flex h-full flex-1 items-end">
              <span
                className={`w-full rounded-md ${bar.highlight ? "bg-lime-deep" : "bg-lime"}`}
                style={{ height: `${bar.value}%` }}
              />
            </span>
          ))}
        </div>
        <p className="mt-3 border-t border-line pt-2.5 text-[9px] text-muted">
          Completion this month: 42 of 56 tasks · 75%
        </p>
      </section>

      <section className="card mb-3 px-4 py-3.5">
        <h3 className="text-[12px] font-bold tracking-tight text-ink">Skills showing up</h3>
        <p className="mt-0.5 text-[9px] text-muted">Based on onWards tagged this month</p>
        <div className="mt-3 space-y-2.5">
          {skillUsage.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-[10px] font-semibold text-inksoft">
                {s.name}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream">
                <span
                  className="block h-full rounded-full bg-lime"
                  style={{ width: `${(s.count / 4) * 100}%` }}
                />
              </span>
              <span className="w-14 shrink-0 text-right text-[9px] font-medium text-muted">
                {s.count} onWards
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-start gap-2.5 rounded-2xl border border-lime-deep/40 bg-lime-pale px-4 py-3.5">
        <Sprout className="mt-0.5 h-3.5 w-3.5 shrink-0 text-inksoft" />
        <p className="text-[10px] leading-[1.6] text-inksoft">
          Consistent effort is becoming a strength. Your onboarding work is a good example to
          bring to your next 1:1.
        </p>
      </section>
    </PhoneShell>
  );
}
