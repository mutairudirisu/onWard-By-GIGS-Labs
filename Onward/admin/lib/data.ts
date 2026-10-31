export type UserStatus = "active" | "invited" | "suspended";
export type Plan = "Free" | "Pro" | "Team";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: Plan;
  status: UserStatus;
  streak: number;
  onwards: number;
  joined: string;
  lastActive: string;
};

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

export const admin = {
  name: "Mutairu Dirisu",
  role: "Platform admin",
  initials: "MD",
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

export const users: AdminUser[] = [
  { id: "u_1042", name: "Maya Chen", email: "maya@fieldworth.io", role: "Operations coordinator", plan: "Pro", status: "active", streak: 16, onwards: 84, joined: "2026-03-12", lastActive: "2h ago" },
  { id: "u_1041", name: "Daniel Okafor", email: "d.okafor@kano.studio", role: "Product designer", plan: "Team", status: "active", streak: 42, onwards: 210, joined: "2026-01-28", lastActive: "5h ago" },
  { id: "u_1039", name: "Priya Nair", email: "priya@northq.co", role: "Data analyst", plan: "Pro", status: "active", streak: 7, onwards: 39, joined: "2026-05-02", lastActive: "1d ago" },
  { id: "u_1035", name: "Tomás Silva", email: "tomas@wavehouse.app", role: "Engineer", plan: "Free", status: "invited", streak: 0, onwards: 0, joined: "2026-10-27", lastActive: "Invited" },
  { id: "u_1030", name: "Aisha Bello", email: "aisha@bloomal.com", role: "Founder", plan: "Team", status: "active", streak: 63, onwards: 318, joined: "2025-11-14", lastActive: "3h ago" },
  { id: "u_1024", name: "Ken Watanabe", email: "ken@zigzagg.jp", role: "Marketer", plan: "Free", status: "suspended", streak: 3, onwards: 12, joined: "2026-06-19", lastActive: "18d ago" },
  { id: "u_1018", name: "Lena Fischer", email: "lena@fieldworth.io", role: "Recruiter", plan: "Pro", status: "active", streak: 21, onwards: 96, joined: "2026-02-08", lastActive: "30m ago" },
  { id: "u_1011", name: "Marcus Ade", email: "marcus@kano.studio", role: "Engineer", plan: "Free", status: "active", streak: 11, onwards: 47, joined: "2026-07-30", lastActive: "6h ago" },
  { id: "u_1004", name: "Sofia Rossi", email: "sofia@northq.co", role: "Writer", plan: "Pro", status: "invited", streak: 0, onwards: 0, joined: "2026-10-29", lastActive: "Invited" },
];

export const broadcasts: Broadcast[] = [
  { id: "b_77", title: "Sunday reset", body: "Small win before the week starts? Log one onWard and keep your streak warm.", channel: "push", audience: "at-risk", status: "sent", when: "2026-10-26 18:00", reach: 1840, opened: 1123 },
  { id: "b_76", title: "Time Capsule is live", body: "Write to future you. Pick a date and onWard sends it back.", channel: "in-app", audience: "all", status: "sent", when: "2026-10-22 09:30", reach: 12480, opened: 6210 },
  { id: "b_75", title: "Pro week", body: "Unlock verified milestones and view analytics through Sunday.", channel: "email", audience: "free", status: "sent", when: "2026-10-15 08:00", reach: 9420, opened: 2418 },
  { id: "b_74", title: "Welcome aboard", body: "Here's how to log your first onWard in under a minute.", channel: "email", audience: "new", status: "sent", when: "2026-10-09 10:00", reach: 642, opened: 401 },
];

export const activity = [
  { who: "Aisha Bello", what: "upgraded to Team", when: "12m ago" },
  { who: "Lena Fischer", what: "hit a 21-day streak", when: "30m ago" },
  { who: "System", what: "sent 'Sunday reset' to 1,840 users", when: "2h ago" },
  { who: "Tomás Silva", what: "invited 3 teammates", when: "4h ago" },
  { who: "Ken Watanabe", what: "account suspended (billing)", when: "1d ago" },
  { who: "Daniel Okafor", what: "shared portfolio link", when: "1d ago" },
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
