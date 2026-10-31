import { PRO_PRICING, STUDENT_PRICING, type OnWard } from "./data";
import { addDays, toISO } from "./dates";
import type { StreakStats } from "./db";

/** What a student can log, and where the quick cards deep link. */
export const STUDENT_LOGS = [
  { project: "Coursework", title: "Coursework", hint: "Assignment, lab, final project" },
  { project: "Side project", title: "Side project", hint: "Something you built for yourself" },
  { project: "Internship", title: "Internship", hint: "Placement or industrial training" },
  { project: "Club or society", title: "Club or society", hint: "Exec role, event, competition" },
  { project: "Part-time job", title: "Part-time job", hint: "Work that fits around classes" },
] as const;

const STUDENT_ROLE = /\bstudent\b/i;

/** The student rate hangs off the role you already set - no extra sign-up step. */
export function isStudentRole(role?: string) {
  return STUDENT_ROLE.test(role ?? "");
}

export function pricingFor(role?: string) {
  return isStudentRole(role) ? STUDENT_PRICING : PRO_PRICING;
}

export function wardsSince(wards: OnWard[], days: number) {
  const since = addDays(toISO(new Date()), -(days - 1));
  return wards.filter((w) => (w.date ?? "") >= since);
}

export function groupByProject(wards: OnWard[]): { project: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const ward of wards) {
    const key = ward.project?.trim() || "Not labelled";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts]
    .map(([project, count]) => ({ project, count }))
    .sort((a, b) => b.count - a.count || a.project.localeCompare(b.project));
}

export type ReadinessItem = {
  key: string;
  label: string;
  detail: string;
  done: boolean;
  href: string;
  cta: string;
};

type ReadinessSource = {
  user: { role?: string; bio?: string };
  onWards: OnWard[];
  skills: string[];
  streak: StreakStats;
};

export function placementReadiness({ user, onWards, skills, streak }: ReadinessSource): ReadinessItem[] {
  const shared = onWards.filter((w) => w.inPortfolio).length;
  const evidence = onWards.reduce((n, w) => n + (w.evidence?.length ?? w.files ?? 0), 0);
  return [
    {
      key: "role",
      label: "Headline set",
      detail: "The first line a recruiter reads.",
      done: Boolean(user.role?.trim()),
      href: "/profile/role",
      cta: "Add your role",
    },
    {
      key: "bio",
      label: "Short intro written",
      detail: "Two lines on what you are good at.",
      done: Boolean(user.bio?.trim()),
      href: "/profile/edit",
      cta: "Write your intro",
    },
    {
      key: "wins",
      label: "Three entries shared",
      detail: `${shared} of 3 in your portfolio.`,
      done: shared >= 3,
      href: "/onwards/new",
      cta: "Log an onWard",
    },
    {
      key: "evidence",
      label: "Evidence attached",
      detail: evidence ? `${evidence} file, link or screenshot.` : "A screenshot or link proves it.",
      done: evidence > 0,
      href: "/onwards",
      cta: "Attach evidence",
    },
    {
      key: "skills",
      label: "Three skills tagged",
      detail: `${skills.length} tagged so far.`,
      done: skills.length >= 3,
      href: "/onwards",
      cta: "Tag your skills",
    },
    {
      key: "streak",
      label: "Logged three days running",
      detail: `Current streak ${streak.current} day${streak.current === 1 ? "" : "s"}.`,
      done: streak.current >= 3,
      href: "/streaks",
      cta: "See your streak",
    },
  ];
}
