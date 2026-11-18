export type Plan = "Free" | "Pro" | "Team";

export type Channel = "push" | "email" | "in-app";
export type Audience = "all" | "active" | "at-risk" | "pro" | "new" | "free";

export type Broadcast = {
  id: string;
  title: string;
  body: string;
  channel: Channel;
  audience: Audience;
  status: "sent" | "scheduled" | "draft";
  when: string;
  reach: number;
  opened: number;
};

export const stats = {
  totalUsers: 12480,
  active7d: 8213,
  newThisWeek: 642,
  paidConversion: 6.4,
  onwardsLogged: 41920,
  broadcastsSent: 38,
  retention: 71,
  d30: 44,
};

// last 7 daily active users, for the overview sparkline/bars
export const dauSeries = [
  { day: "Mon", value: 6120 },
  { day: "Tue", value: 6890 },
  { day: "Wed", value: 7240 },
  { day: "Thu", value: 7010 },
  { day: "Fri", value: 6640 },
  { day: "Sat", value: 5120 },
  { day: "Sun", value: 8213 },
];

export const planSplit: { plan: Plan; count: number; color: string }[] = [
  { plan: "Free", count: 9420, color: "#C9CABC" },
  { plan: "Pro", count: 2610, color: "#B4E13A" },
  { plan: "Team", count: 450, color: "#20211A" },
];

export const broadcasts: Broadcast[] = [
  { id: "b_77", title: "Sunday reset", body: "Small win before the week starts? Log one onWard and keep your streak warm.", channel: "push", audience: "at-risk", status: "sent", when: "2026-10-26 18:00", reach: 1840, opened: 1123 },
  { id: "b_76", title: "Time Capsule is live", body: "Write to future you. Pick a date and onWard sends it back.", channel: "in-app", audience: "all", status: "sent", when: "2026-10-22 09:30", reach: 12480, opened: 6210 },
  { id: "b_75", title: "Pro week", body: "Unlock verified milestones and view analytics through Sunday.", channel: "email", audience: "free", status: "sent", when: "2026-10-15 08:00", reach: 9420, opened: 2418 },
  { id: "b_74", title: "Welcome aboard", body: "Here's how to log your first onWard in under a minute.", channel: "email", audience: "new", status: "sent", when: "2026-10-09 10:00", reach: 642, opened: 401 },
];

export const audienceLabels: Record<Audience | "free", string> = {
  all: "All users",
  active: "Active this week",
  "at-risk": "At-risk (streak < 7)",
  pro: "Pro & Team",
  new: "New this month",
  free: "Free plan",
};

export const channelLabels: Record<Channel, string> = {
  push: "Push",
  email: "Email",
  "in-app": "In-app",
};
