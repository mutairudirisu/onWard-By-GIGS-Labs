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
  const { data, error } = await supabase.rpc("admin_me");
  if (error) throw new Error(error.message);
  return data === true;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("admin_users");
  if (error) throw new Error(error.message);
  return ((data ?? []) as RawUser[]).map(mapUser);
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const { data, error } = await supabase.rpc("admin_overview");
  if (error) throw new Error(error.message);
  const raw = (data ?? {}) as Record<string, unknown>;
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
