"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth";
import { addDays, parseISO, startOfWeek, toISO } from "@/lib/dates";
import { fetchActivity, type ActivityDay, type StreakStats } from "@/lib/db";
import type { HeatCell } from "@/lib/data";

const EMPTY_STREAK: StreakStats = { current: 0, longest: 0, daysUsing: 0 };

export function useActivity(weeks = 26) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const since = useMemo(() => {
    const start = startOfWeek(toISO(new Date()));
    return addDays(start, -7 * (weeks - 1));
  }, [weeks]);

  const [days, setDays] = useState<ActivityDay[]>([]);
  const [streak, setStreak] = useState<StreakStats>(EMPTY_STREAK);
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) {
      setDays([]);
      setStreak(EMPTY_STREAK);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    fetchActivity(userId, since)
      .then((next) => {
        if (cancelled) return;
        setDays(next.days);
        setStreak(next.streak);
      })
      .catch(() => {
        /* keep the last known numbers rather than flashing zeros */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, since, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { days, streak, loaded, reload };
}

export function activityByDay(days: ActivityDay[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const day of days) {
    map[day.day] = (map[day.day] ?? 0) + day.taskCount + day.wardCount + day.noteCount;
  }
  return map;
}

export function heatmapFrom(days: ActivityDay[], weeks = 26): HeatCell[][] {
  const map = activityByDay(days);
  const first = addDays(startOfWeek(toISO(new Date())), -7 * (weeks - 1));
  const columns: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = addDays(first, w * 7 + d);
      const count = map[iso] ?? 0;
      const level: HeatCell["level"] =
        count >= 5 ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : count === 1 ? 1 : 0;
      column.push({ date: iso, level });
    }
    columns.push(column);
  }
  return columns;
}

export function activeDaysIn(days: ActivityDay[], since: string): number {
  return days.filter((d) => d.day >= since).length;
}

export function bestWeekday(days: ActivityDay[]): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const totals = new Array(7).fill(0) as number[];
  for (const day of days) {
    const count = day.taskCount + day.wardCount + day.noteCount;
    totals[parseISO(day.day).getDay()] += count;
  }
  const best = totals.indexOf(Math.max(...totals));
  return totals[best] > 0 ? names[best] : "—";
}

/** Totals in `buckets` equal windows ending today, oldest first. */
export function bucketsFrom(
  days: ActivityDay[],
  buckets: number,
  sizeDays: number,
): { label: string; value: number; highlight?: boolean }[] {
  const map = activityByDay(days);
  const today = toISO(new Date());
  const out: { label: string; value: number; highlight?: boolean }[] = [];
  let max = 0;
  for (let i = buckets - 1; i >= 0; i--) {
    let total = 0;
    const end = addDays(today, -sizeDays * i);
    for (let d = 0; d < sizeDays; d++) {
      total += map[addDays(end, -d)] ?? 0;
    }
    max = Math.max(max, total);
    out.push({ label: `W${buckets - i}`, value: total, highlight: false });
  }
  if (max > 0) {
    out[out.length - 1].highlight = true;
  }
  return out;
}
