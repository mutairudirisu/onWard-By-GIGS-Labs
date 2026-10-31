"use client";

import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, Chip } from "@/components/ui";
import { useStore } from "@/components/store";
import { bucketsFrom, useActivity } from "@/lib/activity";
import { addDays, monthTitle, toISO } from "@/lib/dates";
import { Sprout } from "lucide-react";

const RANGES = ["This week", "This month", "All time"] as const;
type Range = (typeof RANGES)[number];

const WINDOW: Record<Range, number> = {
  "This week": 7,
  "This month": 30,
  "All time": 180,
};

export default function InsightsPage() {
  const [range, setRange] = useState<Range>("This month");
  const { tasks, notes, onWards, skills } = useStore();
  const { days, streak, loaded } = useActivity(27);

  const today = toISO(new Date());
  const since = addDays(today, -(WINDOW[range] - 1));
  const monthStart = `${today.slice(0, 7)}-01`;

  const monthWards = onWards.filter((w) => (w.date ?? "").slice(0, 7) === today.slice(0, 7));
  const monthTasks = tasks.filter((t) => !t.archived && (t.date ?? "").slice(0, 7) === today.slice(0, 7));
  const monthTasksDone = monthTasks.filter((t) => t.done);

  const rangedWards = onWards.filter((w) => (w.date ?? "") >= since);
  const rangedTasks = tasks.filter((t) => !t.archived && (t.date ?? "") >= since);
  const rangedDone = rangedTasks.filter((t) => t.done);

  const buckets = useMemo(
    () => bucketsFrom(days, 6, Math.max(1, Math.round(WINDOW[range] / 6))),
    [days, range],
  );
  const bucketTotal = buckets.reduce((sum, b) => sum + b.value, 0);
  const bucketMax = Math.max(1, ...buckets.map((b) => b.value));

  const skillUsage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ward of onWards) {
      for (const skill of ward.skills) counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [onWards]);
  const skillMax = Math.max(1, ...skillUsage.map((s) => s.count));

  const completion = monthTasks.length
    ? Math.round((monthTasksDone.length / monthTasks.length) * 100)
    : 0;

  const coaching =
    streak.current >= 7
      ? "Consistent effort is becoming a strength. This is a good story to bring to your next 1:1."
      : streak.daysUsing > 0
        ? "Momentum is starting. One completed task or onWard today keeps the streak warm."
        : "Log your first onWard or finish a task today — the picture builds from there.";

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
        <h2 className="text-[13px] font-bold tracking-tight text-ink">{monthTitle(today)}</h2>
        <span className="text-[10px] font-semibold text-muted">
          {monthWards.length} onWard{monthWards.length === 1 ? "" : "s"} logged
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="card px-3.5 py-3">
          <p className="text-[20px] font-bold leading-none tracking-tight text-ink">
            {monthWards.length}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-inksoft">onWards this month</p>
          <p className="mt-0.5 text-[9px] text-muted">
            {onWards.length} logged in total
          </p>
        </div>
        <div className="card px-3.5 py-3">
          <p className="text-[20px] font-bold leading-none tracking-tight text-ink">
            {monthTasksDone.length}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-inksoft">Tasks completed</p>
          <p className="mt-0.5 text-[9px] text-muted">Since {monthStart.slice(8)} {monthTitle(today).split(" ")[0]}</p>
        </div>
      </div>

      <section className="card mb-3 px-4 py-3.5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[12px] font-bold tracking-tight text-ink">
              {range === "This week" ? "Steps this week" : range === "This month" ? "Steps this month" : "Steps all time"}
            </h3>
            <p className="mt-0.5 text-[9px] text-muted">
              Tasks, notes and onWards · {WINDOW[range]} days
            </p>
          </div>
          <span className="text-[18px] font-bold tracking-tight text-ink">{bucketTotal}</span>
        </div>
        <div className="mt-4 flex h-20 items-end justify-between gap-2">
          {buckets.map((bucket) => (
            <span key={bucket.label} className="flex h-full flex-1 items-end">
              <span
                className={`w-full rounded-md ${bucket.highlight ? "bg-lime-deep" : "bg-lime"}`}
                style={{ height: `${Math.max(4, (bucket.value / bucketMax) * 100)}%` }}
                title={`${bucket.label}: ${bucket.value}`}
              />
            </span>
          ))}
        </div>
        <p className="mt-3 border-t border-line pt-2.5 text-[9px] text-muted">
          {loaded
            ? `${rangedDone.length} of ${rangedTasks.length} tasks complete in this window · ${completion}% this month`
            : "Reading your activity…"}
        </p>
      </section>

      <section className="card mb-3 px-4 py-3.5">
        <h3 className="text-[12px] font-bold tracking-tight text-ink">Skills showing up</h3>
        <p className="mt-0.5 text-[9px] text-muted">Based on the onWards you have logged</p>
        {skillUsage.length === 0 ? (
          <p className="mt-3 text-[10px] text-muted">
            Tag skills when you log an onWard and they will show up here.
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {skillUsage.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-[10px] font-semibold text-inksoft">
                  {s.name}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream">
                  <span
                    className="block h-full rounded-full bg-lime"
                    style={{ width: `${(s.count / skillMax) * 100}%` }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right text-[9px] font-medium text-muted">
                  {s.count} onWard{s.count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { value: skills.length, label: "skills" },
          { value: notes.length, label: "notes" },
          { value: rangedWards.length, label: "onWards" },
        ].map((stat) => (
          <div key={stat.label} className="card px-2 py-3 text-center">
            <p className="text-[16px] font-bold leading-none tracking-tight text-ink">{stat.value}</p>
            <p className="mt-1 text-[9px] font-medium text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="flex items-start gap-2.5 rounded-2xl border border-lime-deep/40 bg-lime-pale px-4 py-3.5">
        <Sprout className="mt-0.5 h-3.5 w-3.5 shrink-0 text-inksoft" />
        <p className="text-[10px] leading-[1.6] text-inksoft">{coaching}</p>
      </section>
    </PhoneShell>
  );
}
