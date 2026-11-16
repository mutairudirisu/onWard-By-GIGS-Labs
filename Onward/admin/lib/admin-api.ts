import { supabase } from "@/lib/supabase";

export type AdminUserStatus = "active" | "idle" | "invited";
export type AdminPlan = "Free" | "Pro";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: AdminPlan;
  status: AdminUserStatus;
  streak: number;
  longest: number;
  onwards: number;
  tasks: number;
  notes: number;
  activeDays: number;
  joined: string;
  lastActive: string;
  referralCode: string;
  referralCredits: number;
  proUntil: string | null;
};

export type AdminOverview = {
  totalUsers: number;
  active7d: number;
  new7d: number;
  paid: number;
  onWards: number;
  tasks: number;
  notes: number;
  dau: { day: string; value: number }[];
  recent: { name: string; title: string; when: string }[];
};

async function adminToken() {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error("Sign in to continue.");
  return token;
}

async function adminRequest(action: "check" | "users" | "overview" | "feedback" | "automations"): Promise<unknown> {
  const token = await adminToken();
  const response = await fetch(`/api/admin?action=${action}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "Could not load admin data.";
    throw new Error(message);
  }
  return result;
}

type RawUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  plan: string | null;
  signed_up: string | null;
  last_sign_in: string | null;
  streak: number | null;
  longest: number | null;
  on_wards: number | null;
  tasks: number | null;
  notes: number | null;
  active_days: number | null;
  last_day: string | null;
  referral_code: string | null;
  referral_credits: number | null;
  pro_until: string | null;
};

const DAY = 86_400_000;

function daysSince(iso: string | null) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const when = Date.parse(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(when)) return Number.POSITIVE_INFINITY;
  return (Date.now() - when) / DAY;
}

function lastSeen(iso: string | null) {
  if (!iso) return "Never";
  const days = daysSince(iso);
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  if (days < 30) return `${Math.floor(days)}d ago`;
  return new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function effectivePlan(plan: string | null, proUntil: string | null): AdminPlan {
  if (plan === "pro") return "Pro";
  if (proUntil && Date.parse(proUntil) > Date.now()) return "Pro";
  return "Free";
}

function mapUser(row: RawUser): AdminUser {
  const email = row.email ?? "";
  const name =
    row.display_name?.trim() ||
    email.split("@")[0] ||
    "onWard member";
  const seen = row.last_day ?? row.last_sign_in ?? null;
  const status: AdminUserStatus = !row.last_sign_in
    ? "invited"
    : daysSince(seen) <= 30
      ? "active"
      : "idle";

  return {
    id: row.id,
    name,
    email,
    role: row.role?.trim() || "—",
    plan: effectivePlan(row.plan, row.pro_until),
    status,
    streak: row.streak ?? 0,
    longest: row.longest ?? 0,
    onwards: row.on_wards ?? 0,
    tasks: row.tasks ?? 0,
    notes: row.notes ?? 0,
    activeDays: row.active_days ?? 0,
    joined: (row.signed_up ?? "").slice(0, 10),
    lastActive: lastSeen(seen),
    referralCode: row.referral_code ?? "",
    referralCredits: row.referral_credits ?? 0,
    proUntil: row.pro_until,
  };
}

export async function checkAdmin(): Promise<boolean> {
  const data = await adminRequest("check");
  return (
    typeof data === "object" &&
    data !== null &&
    "isAdmin" in data &&
    data.isAdmin === true
  );
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const data = await adminRequest("users");
  return ((data ?? []) as RawUser[]).map(mapUser);
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const data = await adminRequest("overview");
  const raw = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
  const num = (key: string) => Number(raw[key] ?? 0);
  return {
    totalUsers: num("total_users"),
    active7d: num("active_7d"),
    new7d: num("new_7d"),
    paid: num("paid"),
    onWards: num("on_wards"),
    tasks: num("tasks"),
    notes: num("notes"),
    dau: (raw.dau as AdminOverview["dau"] | undefined) ?? [],
    recent: (raw.recent as AdminOverview["recent"] | undefined) ?? [],
  };
}

export type AdminFeedbackAnswer = "love_it" | "not_really";

export type AdminFeedback = {
  id: string;
  answer: AdminFeedbackAnswer;
  body: string;
  /** Where the card was asked: the Exchange, or on a return after a long gap. */
  screen: string;
  name: string;
  email: string;
  role: string;
  plan: AdminPlan;
  when: string;
};

type RawFeedback = {
  id: string;
  created_at: string | null;
  answer: string | null;
  body: string | null;
  screen: string | null;
  display_name: string | null;
  email: string | null;
  role: string | null;
  plan: string | null;
};

function mapFeedback(row: RawFeedback): AdminFeedback {
  const when = row.created_at ? Date.parse(row.created_at) : NaN;
  return {
    id: row.id,
    answer: row.answer === "love_it" ? "love_it" : "not_really",
    body: row.body ?? "",
    screen: row.screen ?? "",
    name: row.display_name?.trim() || (row.email ?? "").split("@")[0] || "onWard member",
    email: row.email ?? "",
    role: row.role?.trim() || "—",
    plan: effectivePlan(row.plan, null),
    when: Number.isNaN(when)
      ? "—"
      : new Date(when).toLocaleString(undefined, {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
  };
}

export async function fetchAdminFeedback(): Promise<AdminFeedback[]> {
  const data = await adminRequest("feedback");
  return ((data ?? []) as RawFeedback[]).map(mapFeedback);
}

export type AdminPushAutomation = {
  id: "monday_motivation" | "daily_checkin" | "friday_reflection" | "long_absence";
  title: string;
  body: string;
  href: string;
  trigger_type: string;
  local_time: string;
  enabled: boolean;
  sent_7d: number;
  opted_in_users: number;
};

export async function fetchAdminPushAutomations(): Promise<AdminPushAutomation[]> {
  const data = await adminRequest("automations");
  return (data ?? []) as AdminPushAutomation[];
}

export async function updateAdminPushAutomation(
  automation: Pick<AdminPushAutomation, "id" | "enabled" | "local_time" | "title" | "body">,
) {
  const token = await adminToken();
  const response = await fetch("/api/admin", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: automation.id,
      enabled: automation.enabled,
      localTime: automation.local_time,
      title: automation.title,
      body: automation.body,
    }),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof result.error === "string"
        ? result.error
        : "Could not save this notification automation.";
    throw new Error(message);
  }
}

export function usersToCsv(rows: AdminUser[]) {
  const header = [
    "name", "email", "role", "plan", "status", "streak", "longest",
    "on_wards", "tasks", "notes", "active_days", "joined", "last_active",
    "referral_code", "referral_credits", "pro_until",
  ];
  const escape = (value: string | number | null) => {
    const s = value == null ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    header.join(","),
    ...rows.map((u) =>
      [
        u.name, u.email, u.role, u.plan, u.status, u.streak, u.longest,
        u.onwards, u.tasks, u.notes, u.activeDays, u.joined, u.lastActive,
        u.referralCode, u.referralCredits, u.proUntil ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ].join("\n");
}
