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

// null means "unlimited" for that dimension, 0 means "not on this plan".
export type PlanLimits = {
  wardsPerMonth: number | null;
  evidencePerWard: number | null;
  portfolioShares: number | null;
  reminderTasks: number | null;
  verifiedSkills: boolean;
  streakForgiveness: boolean;
  insights: "weekly" | "full";
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    wardsPerMonth: 3,
    evidencePerWard: 0,
    portfolioShares: 1,
    reminderTasks: 3,
    verifiedSkills: false,
    streakForgiveness: false,
    insights: "weekly",
  },
  pro: {
    wardsPerMonth: null,
    evidencePerWard: null,
    portfolioShares: null,
    reminderTasks: null,
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
  { label: "Tasks & notes", free: "Unlimited", pro: "Unlimited" },
  { label: "onWards per month", free: "3", pro: "Unlimited" },
  { label: "Attachments per onWard", free: "None", pro: "Unlimited" },
  { label: "Task reminders", free: "3 tasks", pro: "Unlimited" },
  { label: "Portfolio share links", free: "1", pro: "Unlimited" },
  { label: "Verified skill snapshots", free: false, pro: true },
  { label: "Streak forgiveness & nudges", free: false, pro: true },
  { label: "Dark theme", free: true, pro: true },
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
