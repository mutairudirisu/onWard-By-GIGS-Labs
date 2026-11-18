export const user = {
  name: "Maya Chen",
  initials: "MC",
  email: "maya.chen@email.com",
  role: "Operations coordinator",
  company: "Northwind Logistics",
  location: "London, UK · Open to hybrid work",
  bio: "I turn messy workflows into thoughtful systems that help people do their best work.",
};

export type Theme = "light" | "dark" | "system";

export type Settings = {
  theme: Theme;
  notifications: boolean;
  weeklyDigest: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  messagePrivacy: "everyone" | "connections";
  messageReadReceipts: boolean;
  messageNotifications: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  notifications: true,
  weeklyDigest: false,
  haptics: true,
  reducedMotion: false,
  messagePrivacy: "everyone",
  messageReadReceipts: true,
  messageNotifications: true,
};

export type Plan = "free" | "pro";

// null means "unlimited" for that dimension, 0 means "not on this plan".
// Only what the app actually enforces lives here.
export type PlanLimits = {
  wardsPerMonth: number | null;
  evidenceWards: number | null;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    wardsPerMonth: 3,
    evidenceWards: 3,
  },
  pro: {
    wardsPerMonth: null,
    evidenceWards: null,
  },
};

export const PRO_PRICING = {
  monthly: 1500,
  yearly: 1200, // per month, billed yearly (2 months free)
  currency: "₦",
} as const;

/** Half price while you are studying - the role you set on your profile unlocks it. */
export const STUDENT_PRICING = {
  monthly: 750,
  yearly: 600,
  currency: "₦",
} as const;

export type PlanFeature = {
  label: string;
  free: string | boolean;
  pro: string | boolean;
};

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "onWards per month", free: "3", pro: "Unlimited" },
  { label: "onWards with attachments (lifetime)", free: "3", pro: "Unlimited" },
  { label: "Streak, heatmap and insights", free: true, pro: true },
  { label: "Portfolio page and PDF", free: true, pro: true },
  { label: "CV builder, PDF and plain-text export", free: true, pro: true },
  { label: "Feed posts, with up to 4 photos or clips each", free: true, pro: true },
  { label: "Voice dictation", free: true, pro: true },
  { label: "Dark theme", free: true, pro: true },
  { label: "Offline PWA", free: true, pro: true },
];


export type Evidence = {
  id: string;
  kind: "file" | "url" | "image";
  label: string;
  meta?: string;
  url?: string;
  storagePath?: string;
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

// Backfill dates + evidence on the seed rows so the store has consistent data.
onWards.forEach((w, i) => {
  if (!w.date) w.date = ["2026-10-28", "2026-10-24", "2026-10-20"][i];
  if (!w.evidence)
    w.evidence = Array.from({ length: w.files }).map((_, n) => ({
      id: `${w.id}-f${n}`,
      kind: "file" as const,
      label: n === 0 ? "Onboarding-results.pdf" : "evidence.pdf",
      meta: "PDF · 240 KB",
    }));
});

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

export type HeatCell = { level: 0 | 1 | 2 | 3 | 4; date: string };
