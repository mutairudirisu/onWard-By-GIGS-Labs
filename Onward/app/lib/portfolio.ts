import type { OnWard } from "./data";
import type { ActivityDay, StreakStats } from "./db";

/** Three logged wins fills a skill bar. */
const SKILL_TARGET = 3;

export type PortfolioWin = {
  id: string;
  title: string;
  impact: string;
  body?: string;
  meta: string;
  skills: string[];
  evidence: number;
};

export type PortfolioSkill = {
  name: string;
  count: number;
  percent: number;
  stage: string;
};

export type PortfolioModel = {
  name: string;
  initials: string;
  role?: string;
  location?: string;
  bio?: string;
  email: string;
  activeDays: number;
  stats: { value: string; label: string }[];
  headline: PortfolioWin[];
  wins: PortfolioWin[];
  skills: PortfolioSkill[];
};

type Source = {
  user: { name: string; initials: string; role?: string; location?: string; bio?: string; email?: string };
  onWards: OnWard[];
  skills: string[];
  days: ActivityDay[];
  streak: StreakStats;
  activeDays?: number;
};

function byDateDesc(a: OnWard, b: OnWard) {
  return (b.date ?? "").localeCompare(a.date ?? "");
}

function toWin(ward: OnWard): PortfolioWin {
  const meta = [ward.dateLabel, ward.project].filter(Boolean).join(" · ");
  return {
    id: ward.id,
    title: ward.title,
    impact: ward.impact,
    body: ward.body,
    meta: meta || "Logged in onWard",
    skills: ward.skills,
    evidence: ward.evidence?.length ?? ward.files ?? 0,
  };
}

function stageFor(count: number) {
  if (count >= SKILL_TARGET) return "Proven";
  if (count === 2) return "Practising";
  return "Recorded";
}

export function buildPortfolio({
  user,
  onWards,
  skills,
  days,
  streak,
  activeDays,
}: Source): PortfolioModel {
  const ordered = [...onWards].sort(byDateDesc);
  const shared = ordered.filter((w) => w.inPortfolio);
  const list = shared.length ? shared : ordered;

  const counts = new Map<string, number>();
  for (const ward of ordered) {
    for (const name of ward.skills) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  const names = skills.length ? skills : [...counts.keys()];
  const ranked = [...names]
    .map((name) => {
      const count = counts.get(name) ?? 0;
      return {
        name,
        count,
        percent: Math.max(18, Math.min(100, Math.round((count / SKILL_TARGET) * 100))),
        stage: stageFor(count),
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 8);

  return {
    name: user.name,
    initials: user.initials,
    role: user.role?.trim() || undefined,
    location: user.location?.trim() || undefined,
    bio: user.bio?.trim() || undefined,
    email: user.email ?? "",
    activeDays: activeDays ?? days.length,
    stats: [
      { value: String(ordered.length), label: "onWards logged" },
      { value: String(ranked.length), label: "skills tracked" },
      { value: String(streak.current), label: "day streak" },
      { value: String(streak.longest), label: "longest run" },
      { value: String(days.length), label: "active days" },
      {
        value: String(
          list.reduce((n, w) => n + (w.evidence?.length ?? w.files ?? 0), 0),
        ),
        label: "evidence items",
      },
    ],
    headline: list.slice(0, 2).map(toWin),
    wins: list.map(toWin),
    skills: ranked,
  };
}
