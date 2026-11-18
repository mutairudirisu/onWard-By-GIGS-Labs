"use client";

import { useEffect, useMemo, useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { ShareButton } from "@/components/share-button";
import { BackLink, Chip } from "@/components/ui";
import { useAuth, useCurrentUser } from "@/components/auth";
import { fetchLeaderboard, type LeaderboardRow } from "@/lib/db";
import { Crown, Flame, Trophy } from "lucide-react";
import { BoardSkeleton } from "@/components/skeleton";

const PERIODS = ["This week", "This month", "All time"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_KEY: Record<Period, "week" | "month" | "all"> = {
  "This week": "week",
  "This month": "month",
  "All time": "all",
};

const RANK_STYLE = [
  "bg-lime text-dark",
  "bg-[#E4E6D8] text-ink",
  "bg-[#EFE7D6] text-ink",
];

export default function LeaderboardPage() {
  const user = useCurrentUser();
  const { user: authUser } = useAuth();
  const userId = authUser?.id ?? null;
  const [period, setPeriod] = useState<Period>("This month");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetchLeaderboard(PERIOD_KEY[period])
      .then((next) => {
        if (cancelled) return;
        setRows(next);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const you = useMemo(
    () => rows.find((r) => r.userId === userId) ?? null,
    [rows, userId],
  );
  const top = rows.slice(0, 3);
  const podium = [top[1], top[0], top[2]].filter((r): r is LeaderboardRow => Boolean(r));

  const shareText = you
    ? `I'm #${you.place} on the onWard leaderboard with ${you.onWards} onWard${
        you.onWards === 1 ? "" : "s"
      } ${period.toLowerCase()} and a ${you.streak}-day streak.`
    : "I'm building a record of my wins on onWard — one small step at a time.";

  return (
    <PhoneShell tab="you">
      <div className="mb-1 flex items-center gap-1">
        <BackLink href="/profile" label="Back to profile" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Leaderboard</h1>
      </div>
      <p className="tiny mb-4">
        A friendly nudge. {you ? "You're on the board — keep climbing." : "Every onWard counts."}
      </p>

      <div className="mb-4 flex gap-2">
        {PERIODS.map((p) => (
          <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p}
          </Chip>
        ))}
      </div>

      {state === "loading" ? (
        <div className="card px-4 py-1">
          <BoardSkeleton rows={7} />
        </div>
      ) : state === "error" ? (
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">The board is out of reach right now.</p>
          <p className="tiny mt-1">Check your connection and try again.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">No one has logged an onWard yet.</p>
          <p className="tiny mt-1">The first win puts your name on the board.</p>
        </div>
      ) : (
        <>
          {podium.length > 0 ? (
            <section className="mb-4 flex items-end justify-center gap-3">
              {podium.map((r) => {
                const place = r.place;
                const h = place === 1 ? "h-20" : place === 2 ? "h-16" : "h-12";
                return (
                  <div key={r.userId} className="flex w-1/3 flex-col items-center">
                    <span className="relative mb-1.5">
                      <span
                        className={`flex ${
                          place === 1 ? "h-12 w-12 text-[13px]" : "h-10 w-10 text-[11px]"
                        } items-center justify-center rounded-full ${
                          place === 1 ? "bg-lime text-dark" : "bg-lime-soft text-ink"
                        } font-bold`}
                      >
                        {r.initials}
                      </span>
                      {place === 1 ? (
                        <Crown
                          className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 text-lime-deep"
                          fill="#B4E13A"
                        />
                      ) : null}
                    </span>
                    <span className="max-w-full truncate text-[10px] font-semibold text-ink">
                      {r.userId === userId ? "You" : r.name.split(" ")[0]}
                    </span>
                    <span
                      className={`mt-1.5 flex w-full items-center justify-center rounded-t-xl ${h} ${
                        place === 1 ? "bg-lime" : place === 2 ? "bg-[#E4E6D8]" : "bg-[#EFE7D6]"
                      }`}
                    >
                      <span className="text-[13px] font-bold text-ink">{r.onWards}</span>
                    </span>
                  </div>
                );
              })}
            </section>
          ) : null}

          <section className="card divide-y divide-line px-4">
            {rows.map((r) => {
              const isYou = r.userId === userId;
              return (
                <div
                  key={r.userId}
                  className={`flex items-center gap-3 py-3 ${isYou ? "-mx-4 bg-lime-pale px-8" : ""}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      r.place <= 3 ? RANK_STYLE[r.place - 1] : "bg-cream text-muted"
                    }`}
                  >
                    {r.place}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isYou ? "bg-lime text-dark" : "bg-lime-soft text-ink"
                    }`}
                  >
                    {r.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink">
                      {isYou ? `${user.name.split(" ")[0]} · You` : r.name.split(" ")[0]}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[9px] text-muted">
                      <Flame className="h-3 w-3 text-lime-deep" /> {r.streak}-day streak
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[13px] font-bold tracking-tight text-ink">
                      {r.onWards}
                    </span>
                    <span className="block text-[8px] font-medium uppercase tracking-wide text-muted">
                      onWards
                    </span>
                  </span>
                </div>
              );
            })}
          </section>
        </>
      )}

      <div className="mt-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-soft text-inksoft">
          <Trophy className="h-4 w-4" />
        </span>
        <p className="flex-1 text-[9.5px] leading-[1.5] text-muted">
          Ranked by onWards logged {period.toLowerCase()}. Only first names and initials are shown.
        </p>
        <ShareButton
          text={shareText}
          label="Share"
          className="flex items-center gap-1.5 rounded-full border border-dash bg-paper px-3 py-1.5 text-[10px] font-semibold text-ink"
        />
      </div>
    </PhoneShell>
  );
}
