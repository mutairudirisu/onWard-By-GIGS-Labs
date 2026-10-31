export const user = {
  name: "Maya Chen",
  initials: "MC",
  email: "maya.chen@email.com",
  role: "Operations coordinator",
  company: "Northwind Logistics",
  location: "London, UK · Open to hybrid work",
  bio: "I turn messy workflows into thoughtful systems that help people do their best work.",
};

export const PRIORITIES = ["Low", "Medium", "High"] as const;

export const LIST_TYPES = [
  "Work",
  "Personal",
  "Learning",
  "Health",
  "Errands",
  "Ideas",
] as const;

export const NOTE_TYPES = [
  "Work",
  "Personal",
  "Career",
  "Ideas",
  "Health",
  "Finance",
  "Learning",
  "Journal",
] as const;

export type Settings = {
  theme: "light" | "dark";
  notifications: boolean;
  weeklyDigest: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  defaultReminderTime: string;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  notifications: true,
  weeklyDigest: false,
  haptics: true,
  reducedMotion: false,
  defaultReminderTime: "09:00",
};

export type Plan = "free" | "pro";

// null means "unlimited" for that dimension.
export type PlanLimits = {
  wardsPerMonth: number | null;
  evidencePerWard: number | null;
  portfolioShares: number | null;
  reminders: boolean;
  darkTheme: boolean;
  verifiedSkills: boolean;
  streakForgiveness: boolean;
  insights: "weekly" | "full";
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    wardsPerMonth: 3,
    evidencePerWard: 1,
    portfolioShares: 1,
    reminders: false,
    darkTheme: false,
    verifiedSkills: false,
    streakForgiveness: false,
    insights: "weekly",
  },
  pro: {
    wardsPerMonth: null,
    evidencePerWard: null,
    portfolioShares: null,
    reminders: true,
    darkTheme: true,
    verifiedSkills: true,
    streakForgiveness: true,
    insights: "full",
  },
};

export const PRO_PRICING = {
  monthly: 1500,
  yearly: 1200, // per month, billed yearly (2 months free)
  currency: "₦",
} as const;

export type PlanFeature = {
  label: string;
  free: string | boolean;
  pro: string | boolean;
};

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Tasks & notes", free: "Unlimited", pro: "Unlimited" },
  { label: "onWards per month", free: "3", pro: "Unlimited" },
  { label: "Evidence per onWard", free: "1 file", pro: "Unlimited" },
  { label: "Smart reminders", free: false, pro: true },
  { label: "Portfolio share links", free: "1", pro: "Unlimited" },
  { label: "Verified skill snapshots", free: false, pro: true },
  { label: "Streak forgiveness & nudges", free: false, pro: true },
  { label: "Dark theme", free: false, pro: true },
  { label: "Insights", free: "Weekly", pro: "Full history" },
  { label: "Offline PWA", free: true, pro: true },
];


export type Task = {
  id: string;
  title: string;
  meta: string;
  todaySub?: string;
  time?: string;
  done: boolean;
  notes?: string;
  dueDate?: string;
  list?: string;
  priority?: string;
  date?: string; // yyyy-mm-dd the task belongs to
  archived?: boolean;
};

export const tasks: Task[] = [
  {
    id: "review-project-milestones",
    title: "Review project milestones",
    meta: "Atlas onboarding · 30 min",
    todaySub: "Work · Atlas onboarding",
    time: "10:00",
    done: false,
    notes: "Check the Atlas onboarding rollout with Priya. Bring the new-hire feedback.",
    dueDate: "28 Oct 2026",
    list: "Work",
    priority: "High",
  },
  {
    id: "send-onboarding-summary",
    title: "Send the onboarding summary",
    meta: "Atlas onboarding · 15 min",
    todaySub: "Work · Add results to project notes",
    time: "15:00",
    done: false,
    notes: "Wrap the week-one results and share them with the Atlas channel.",
    dueDate: "28 Oct 2026",
    list: "Work",
    priority: "Medium",
  },
  {
    id: "update-onboarding-checklist",
    title: "Update the onboarding checklist",
    meta: "Work · Ready to log as an onWard",
    done: true,
  },
  {
    id: "collect-new-hire-feedback",
    title: "Collect new-hire feedback",
    meta: "Work · 12 responses collected",
    done: true,
  },
  {
    id: "read-weekly-product-digest",
    title: "Read the weekly product digest",
    meta: "Learning · 20 min",
    done: true,
  },
  {
    id: "plan-weeks-priorities",
    title: "Plan this week's priorities",
    meta: "Work · 15 min",
    done: true,
  },
];

export type Note = {
  id: string;
  title: string;
  excerpt: string;
  tag: string;
  when: string;
  pinned?: boolean;
  body?: string;
  priority?: string;
};

export const notes: Note[] = [
  {
    id: "atlas-onboarding-reflections",
    title: "Atlas onboarding reflections",
    excerpt:
      "What worked, what surprised us, and how we cut time-to-ready from 5 days to 3.",
    tag: "Work",
    when: "Edited today",
    pinned: true,
    priority: "High",
    body:
      "We made the first week feel less like a maze. The new checklist brings every handoff into one place, with a clear owner at each step.\n\nWhat changed:\n• Time-to-ready fell from 5 days to 3.\n• 12 new hires used the updated flow.\n• Fewer repeat questions in the team channel.\n\n“The best process is the one people don’t have to think about.”\n\nFor the milestone review: ask Priya where the next bottleneck is, and keep measuring time-to-ready for the November cohort.",
  },
  {
    id: "questions-for-next-1-1",
    title: "Questions for my next 1:1",
    excerpt:
      "Talk about the operations exec push. Bring examples of the onboarding project.",
    tag: "Career",
    when: "Yesterday",
    body:
      "Talk about the operations exec push. Bring examples of the onboarding project and the time-to-ready numbers. Ask what “exceptional” looks like at the next level.",
  },
  {
    id: "a-calmer-monday",
    title: "A calmer Monday",
    excerpt: "Protect an hour for deep work. One clear priority is better than ten open tabs.",
    tag: "Personal",
    when: "26 Oct",
    body:
      "Protect an hour for deep work before opening the inbox. One clear priority is better than ten open tabs.",
  },
];

export type Evidence = {
  id: string;
  kind: "file" | "url" | "image";
  label: string;
  meta?: string;
};

export type OnWard = {
  id: string;
  dateLabel: string;
  title: string;
  impact: string;
  skills: string[];
  files: number;
  inPortfolio: boolean;
  project?: string;
  date?: string; // yyyy-mm-dd
  body?: string;
  evidence?: Evidence[];
};

export const onWards: OnWard[] = [
  {
    id: "a-smoother-start-for-new-hires",
    dateLabel: "28 OCT · TODAY",
    title: "A smoother start for new hires",
    impact: "40% faster onboarding · 12 new hires",
    skills: ["Process design", "Collaboration"],
    files: 1,
    inPortfolio: true,
    project: "Atlas · Operations",
  },
  {
    id: "made-team-knowledge-easier-to-find",
    dateLabel: "24 OCT · SATURDAY",
    title: "Made team knowledge easier to find",
    impact: "Saved an estimated 3 hours each week",
    skills: ["Documentation", "Communication"],
    files: 1,
    inPortfolio: true,
    project: "Atlas · Operations",
  },
  {
    id: "one-dashboard-a-clearer-picture",
    dateLabel: "20 OCT · TUESDAY",
    title: "One dashboard, a clearer picture",
    impact: "3 data sources · 4 hours saved per week",
    skills: ["Spreadsheets", "Data analysis"],
    files: 2,
    inPortfolio: true,
    project: "Meridian · Reporting",
  },
];

export const skills = [
  "Process design",
  "Collaboration",
  "Documentation",
  "Communication",
  "Spreadsheets",
  "Data analysis",
];

// The mock "today" the app is anchored to.
export const BASE_DATE = "2026-10-28";

// Backfill dates + evidence on the seed rows so the store has consistent data.
tasks.forEach((t) => {
  if (!t.date) t.date = BASE_DATE;
});
onWards.forEach((w, i) => {
  if (!w.date) w.date = ["2026-10-28", "2026-10-24", "2026-10-20"][i] ?? BASE_DATE;
  if (!w.evidence)
    w.evidence = Array.from({ length: w.files }).map((_, n) => ({
      id: `${w.id}-f${n}`,
      kind: "file" as const,
      label: n === 0 ? "Onboarding-results.pdf" : "evidence.pdf",
      meta: "PDF · 240 KB",
    }));
});

export const skillTests = [
  { name: "Spreadsheet essentials", score: "88/100", meta: "Verified assessment · 12 Oct 2026" },
  { name: "Data literacy", score: "82/100", meta: "Self-assessed · work examples reviewed" },
];

export const weekDays = [
  { letter: "M", day: 26 },
  { letter: "T", day: 27 },
  { letter: "W", day: 28, active: true },
  { letter: "T", day: 29 },
  { letter: "F", day: 30 },
  { letter: "S", day: 31 },
  { letter: "S", day: 1 },
];

export const insightBars = [
  { label: "W1", value: 34 },
  { label: "W2", value: 46 },
  { label: "W3", value: 40 },
  { label: "W4", value: 78 },
  { label: "W5", value: 52 },
  { label: "W6", value: 44 },
  { label: "W7", value: 96, highlight: true },
];

export const skillUsage = [
  { name: "Process design", count: 4 },
  { name: "Collaboration", count: 3 },
  { name: "Data analysis", count: 2 },
];

export const portfolioWins = [
  {
    meta: "ATLAS · 28 OCT 2026",
    title: "A smoother start for new hires",
    highlight: "5 days → 3 days to get ready",
    body: "Redesigned the onboarding checklist and coordinated handoffs with three team leads for the October cohort. Cut time-to-ready for 12 new hires.",
    skills: ["Process design", "Collaboration"],
  },
  {
    meta: "ATLAS · 24 OCT 2026",
    title: "Knowledge that's easier to find",
    highlight: "An estimated 3 hours saved / week",
    body: "Consolidated team guides into a single, searchable workspace with clear ownership and review dates.",
    skills: ["Communication", "Documentation"],
  },
  {
    meta: "MERIDIAN · 20 OCT 2026",
    title: "One dashboard, a clearer picture",
    highlight: "3 data sources. 4 hours saved / week",
    body: "Combined weekly reporting into one spreadsheet dashboard, with automatic checks and a single handover point.",
    skills: ["Spreadsheets", "Data analysis"],
  },
];

/* ------------------------------------------------------------------ *
 * Streaks, activity heatmap, roles and leaderboard (Turn D)
 * ------------------------------------------------------------------ */

export const streak = {
  current: 12,
  longest: 28,
  daysUsing: 143,
  joined: "3 June 2026",
  onWardsThisWeek: 5,
  thisMonth: 7,
  bestDay: "Tuesday",
};

export const roles = [
  "Operations coordinator",
  "Project manager",
  "Software engineer",
  "Designer",
  "Data analyst",
  "Customer success",
  "Marketing",
  "Educator",
  "Student",
];

export const appraisal = {
  company: "Northwind Logistics",
  role: "Operations coordinator",
  period: "October 2026 review",
  manager: "Priya Nair",
  assigned: { total: 56, done: 42, onTime: "92%" },
  outcomes: [
    "Cut new-hire time-to-ready from 5 days to 3 across the October cohort.",
    "Consolidated team guides into one searchable workspace (~3h/wk saved).",
    "Delivered a single reporting dashboard combining 3 data sources.",
  ],
};

export type LeaderRow = {
  rank: number;
  name: string;
  initials: string;
  onWards: number;
  streak: number;
  you?: boolean;
};

export const leaderboard: { period: string; rows: LeaderRow[] } = {
  period: "This month",
  rows: [
    { rank: 1, name: "Amara Okafor", initials: "AO", onWards: 14, streak: 31 },
    { rank: 2, name: "Priya Nair", initials: "PN", onWards: 11, streak: 19 },
    { rank: 3, name: "Maya Chen", initials: "MC", onWards: 7, streak: 12, you: true },
    { rank: 4, name: "Tomás Silva", initials: "TS", onWards: 6, streak: 8 },
    { rank: 5, name: "Lena Fischer", initials: "LF", onWards: 5, streak: 22 },
    { rank: 6, name: "Kwame Mensah", initials: "KM", onWards: 4, streak: 6 },
    { rank: 7, name: "Sofia Rossi", initials: "SR", onWards: 3, streak: 11 },
  ],
};

export type HeatCell = { level: 0 | 1 | 2 | 3 | 4; date: string };

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic 26-week (half-year) activity grid so SSR and CSR render identically.
function buildHeatmap(weeks: number): HeatCell[][] {
  const rand = mulberry32(20261028);
  const today = new Date(2026, 9, 28);
  const cols: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const offset = (weeks - 1 - w) * 7 + (6 - d);
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const future = date.getTime() > today.getTime();
      const r = rand();
      let level: HeatCell["level"];
      if (future) level = 0;
      else if (r < 0.4) level = 0;
      else if (r < 0.64) level = 1;
      else if (r < 0.82) level = 2;
      else if (r < 0.94) level = 3;
      else level = 4;
      // keep the current streak visible in the last column
      if (w === weeks - 1 && d >= 1 && d <= 5 && level === 0) level = 2;
      col.push({ level, date: date.toISOString().slice(0, 10) });
    }
    cols.push(col);
  }
  return cols;
}

export const heatmap: HeatCell[][] = buildHeatmap(26);

export const activeDaysThisYear = heatmap.reduce(
  (n, col) => n + col.filter((c) => c.level > 0).length,
  0
);
