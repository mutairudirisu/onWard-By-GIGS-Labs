"use client";

import { useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { ShareButton } from "@/components/share-button";
import { BackLink, Chip } from "@/components/ui";
import { useCurrentUser } from "@/components/auth";
import { leaderboard } from "@/lib/data";
import { Crown, Flame, Trophy } from "lucide-react";

const PERIODS = ["This week", "This month", "All time"];

const RANK_STYLE = [
  "bg-lime text-ink",
  "bg-[#E4E6D8] text-ink",
  "bg-[#EFE7D6] text-ink",
];

export default function LeaderboardPage() {
  const user = useCurrentUser();
  const [period, setPeriod] = useState("This month");
  const rows = leaderboard.rows;
  const you = rows.find((r) => r.you);

  const shareText = `I'm #${you?.rank ?? 3} on my team's onWard leaderboard with a ${
    you?.streak ?? 12
  }-day streak. Coming for the top spot.`;

  return (
    <PhoneShell tab="you">
      <div className="mb-1 flex items-center gap-1">
        <BackLink href="/profile" label="Back to profile" />
        <h1 className="text-[17px] font-bold tracking-tight text-ink">Leaderboard</h1>
      </div>
      <p className="tiny mb-4">
        A friendly nudge. {period === "This month" ? "You're climbing." : "Keep it steady."}
      </p>

      <div className="mb-4 flex gap-2">
        {PERIODS.map((p) => (
          <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p}
          </Chip>
        ))}
      </div>

      <section className="mb-4 flex items-end justify-center gap-3">
        {[rows[1], rows[0], rows[2]].map((r, i) => {
          const place = r.rank;
          const h = place === 1 ? "h-20" : place === 2 ? "h-16" : "h-12";
          return (
            <div key={r.name} className="flex w-1/3 flex-col items-center">
              <span className="relative mb-1.5">
                <span
                  className={`flex ${
                    place === 1 ? "h-12 w-12 text-[13px]" : "h-10 w-10 text-[11px]"
                  } items-center justify-center rounded-full ${
                    place === 1 ? "bg-lime text-ink" : "bg-lime-soft text-ink"
                  } font-bold`}
                >
                  {r.initials}
                </span>
                {place === 1 ? (
                  <Crown className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 text-lime-deep" fill="#B4E13A" />
                ) : null}
              </span>
              <span className="max-w-full truncate text-[10px] font-semibold text-ink">
                {r.you ? "You" : r.name.split(" ")[0]}
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

      <section className="card divide-y divide-line px-4">
        {rows.map((r) => (
          <div
            key={r.name}
            className={`flex items-center gap-3 py-3 ${r.you ? "-mx-4 bg-lime-pale px-8" : ""}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                r.rank <= 3 ? RANK_STYLE[r.rank - 1] : "bg-cream text-muted"
              }`}
            >
              {r.rank}
            </span>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                r.you ? "bg-lime text-ink" : "bg-lime-soft text-ink"
              }`}
            >
              {r.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink">
                {r.you ? `${user.name} · You` : r.name}
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
        ))}
      </section>

      <div className="mt-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-soft text-inksoft">
          <Trophy className="h-4 w-4" />
        </span>
        <p className="flex-1 text-[9.5px] leading-[1.5] text-muted">
          Leagues reset monthly. Only your first name and initials are shown to teammates.
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
