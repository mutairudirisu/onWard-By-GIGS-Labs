import { supabase } from "./supabase";
import {
  DEFAULT_SETTINGS,
  type Evidence,
  type Note,
  type OnWard,
  type Plan,
  type Settings,
  type Task,
} from "./data";
import { formatMedium, toISO, wardDateLabel } from "./dates";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type Profile = {
  id: string;
  displayName: string;
  initials: string;
  role: string;
  location: string;
  bio: string;
  avatarUrl: string | null;
  plan: Plan;
  referralCode: string;
  referralCredits: number;
  proUntil: string | null;
};

export type ActivityDay = {
  day: string;
  taskCount: number;
  wardCount: number;
  noteCount: number;
};

export type StreakStats = {
  current: number;
  longest: number;
  daysUsing: number;
};

export type LeaderboardRow = {
  place: number;
  userId: string;
  name: string;
  initials: string;
  streak: number;
  onWards: number;
};

export type ReferralRecord = {
  name: string;
  initials: string;
  status: "joined" | "qualified";
  joined: string;
};

export type MyReferrals = {
  code: string;
  credits: number;
  proUntil: string | null;
  referrals: ReferralRecord[];
};

export type Workspace = {
  tasks: Task[];
  notes: Note[];
  onWards: OnWard[];
  skills: string[];
  settings: Settings;
  plan: Plan;
};

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  meta: string | null;
  notes: string | null;
  time: string | null;
  day: string | null;
  due_date: string | null;
  list: string | null;
  priority: string | null;
  done: boolean;
  archived: boolean;
  sort_order: number;
};

type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  excerpt: string;
  body: string;
  tag: string | null;
  priority: string | null;
  pinned: boolean;
  updated_at: string;
};

type WardRow = {
  id: string;
  user_id: string;
  title: string;
  impact: string;
  body: string | null;
  project: string | null;
  day: string | null;
  in_portfolio: boolean;
  created_at?: string;
  ward_skills?: { skill_id: string; skills: { name: string } | null }[];
  evidence?: EvidenceRow[];
};

type EvidenceRow = {
  id: string;
  kind: "file" | "url" | "image";
  label: string;
  meta: string | null;
};

type SettingsRow = {
  user_id: string;
  theme: "light" | "dark";
  notifications: boolean;
  weekly_digest: boolean;
  haptics: boolean;
  reduced_motion: boolean;
  default_reminder_time: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
  initials: string | null;
  role: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  plan: Plan;
  referral_code: string | null;
  referral_credits: number | null;
  pro_until: string | null;
};

function effectivePlan(plan: Plan, proUntil: string | null | undefined): Plan {
  if (plan === "pro") return "pro";
  if (proUntil && Date.parse(proUntil) > Date.now()) return "pro";
  return "free";
}

function fail(...errors: ({ message: string } | null)[]) {
  const first = errors.find((e) => e != null);
  if (first) throw new Error(first.message);
}

// ------------------------------------------------------------------- ids & dates

export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

/** "2026-10-28", "28 Oct 2026" and anything Date can read all become yyyy-mm-dd. */
export function toIsoDate(value?: string | null): string | null {
  const text = value?.trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const dayMonthYear = text.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (dayMonthYear) {
    const [, day, month, year] = dayMonthYear;
    const index = MONTHS.findIndex((m) =>
      m.toLowerCase().startsWith(month.slice(0, 3).toLowerCase()),
    );
    if (index >= 0) {
      return `${year}-${String(index + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : toISO(new Date(parsed));
}

function relativeWhen(timestamp: string): string {
  const day = timestamp.slice(0, 10);
  const today = toISO(new Date());
  if (day === today) return "Edited today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === toISO(yesterday)) return "Yesterday";
  return formatMedium(day).split(" ").slice(0, 2).join(" ");
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

// ------------------------------------------------------------------------ reading

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as ProfileRow | null;
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    initials: row.initials || initialsFor(row.display_name),
    role: row.role ?? "",
    location: row.location ?? "",
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url,
    plan: effectivePlan(row.plan, row.pro_until),
    referralCode: row.referral_code ?? "",
    referralCredits: row.referral_credits ?? 0,
    proUntil: row.pro_until,
  };
}

export async function fetchWorkspace(userId: string): Promise<Workspace> {
  const [tasksRes, notesRes, wardsRes, skillsRes, settingsRes, profileRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false }),
    supabase
      .from("on_wards")
      .select("*, ward_skills(skill_id, skills(name)), evidence(id, kind, label, meta)")
      .eq("user_id", userId)
      .order("day", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("skills").select("name").eq("user_id", userId).order("created_at"),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("plan, pro_until").eq("id", userId).maybeSingle(),
  ]);

  fail(tasksRes.error, notesRes.error, wardsRes.error, skillsRes.error, settingsRes.error, profileRes.error);

  const tasks: TaskRow[] = tasksRes.data ?? [];
  const notes: NoteRow[] = notesRes.data ?? [];
  const wards: WardRow[] = wardsRes.data ?? [];
  const skillRows: { name: string }[] = skillsRes.data ?? [];
  const settingsRow = (settingsRes.data ?? null) as SettingsRow | null;

  return {
    tasks: tasks.map(taskFromRow),
    notes: notes.map(noteFromRow),
    onWards: wards.map(wardFromRow),
    skills: skillRows.map((s) => s.name),
    settings: settingsFromRow(settingsRow),
    plan: effectivePlan(
      ((profileRes.data as { plan?: Plan } | null)?.plan ?? "free") as Plan,
      (profileRes.data as { pro_until?: string | null } | null)?.pro_until,
    ),
  };
}

function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    meta: row.meta ?? "",
    todaySub: row.list ?? undefined,
    time: row.time ?? undefined,
    done: row.done,
    notes: row.notes ?? undefined,
    dueDate: row.due_date ? formatMedium(row.due_date) : undefined,
    list: row.list ?? undefined,
    priority: row.priority ?? undefined,
    date: row.day ?? undefined,
    archived: row.archived,
  };
}

function noteFromRow(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    tag: row.tag ?? "Personal",
    when: relativeWhen(row.updated_at),
    pinned: row.pinned,
    priority: row.priority ?? undefined,
  };
}

function wardFromRow(row: WardRow): OnWard {
  const evidence = (row.evidence ?? []).map(
    (e): Evidence => ({ id: e.id, kind: e.kind, label: e.label, meta: e.meta ?? undefined }),
  );
  const date = row.day ?? undefined;
  return {
    id: row.id,
    dateLabel: date ? wardDateLabel(date) : "",
    title: row.title,
    impact: row.impact,
    body: row.body ?? undefined,
    project: row.project ?? undefined,
    date,
    skills: (row.ward_skills ?? [])
      .map((link) => link.skills?.name)
      .filter((name): name is string => Boolean(name)),
    evidence,
    files: evidence.length,
    inPortfolio: row.in_portfolio,
  };
}

function settingsFromRow(row: SettingsRow | null): Settings {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    theme: row.theme,
    notifications: row.notifications,
    weeklyDigest: row.weekly_digest,
    haptics: row.haptics,
    reducedMotion: row.reduced_motion,
    defaultReminderTime: row.default_reminder_time,
  };
}

// ------------------------------------------------------------------------ writing

export async function writeTask(userId: string, task: Task, sortOrder: number) {
  const { error } = await supabase.from("tasks").upsert(
    {
      id: task.id,
      user_id: userId,
      title: task.title,
      meta: task.meta ?? "",
      notes: task.notes ?? null,
      time: task.time ?? null,
      day: task.date ?? null,
      due_date: toIsoDate(task.dueDate),
      list: task.list ?? null,
      priority: task.priority ?? null,
      done: task.done,
      archived: task.archived ?? false,
      sort_order: sortOrder,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}

export async function writeTaskOrder(pairs: { id: string; sort_order: number }[]) {
  const results = await Promise.all(
    pairs.map(({ id, sort_order }) =>
      supabase.from("tasks").update({ sort_order }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export async function writeNote(userId: string, note: Note) {
  const { error } = await supabase.from("notes").upsert(
    {
      id: note.id,
      user_id: userId,
      title: note.title,
      excerpt: note.excerpt,
      body: note.body ?? "",
      tag: note.tag,
      priority: note.priority ?? null,
      pinned: note.pinned ?? false,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}

async function skillIdsFor(userId: string, names: string[]): Promise<string[]> {
  if (!names.length) return [];
  const { error } = await supabase
    .from("skills")
    .upsert(names.map((name) => ({ user_id: userId, name })), { onConflict: "user_id,name" });
  if (error) throw new Error(error.message);
  const { data, error: readError } = await supabase
    .from("skills")
    .select("id")
    .eq("user_id", userId)
    .in("name", names);
  if (readError) throw new Error(readError.message);
  return (data ?? []).map((row: { id: string }) => row.id);
}

async function writeWardLinks(userId: string, ward: OnWard) {
  const ids = await skillIdsFor(userId, ward.skills);
  const { error: unlinkError } = await supabase
    .from("ward_skills")
    .delete()
    .eq("ward_id", ward.id);
  if (unlinkError) throw new Error(unlinkError.message);
  if (ids.length) {
    const { error } = await supabase
      .from("ward_skills")
      .insert(ids.map((skill_id) => ({ ward_id: ward.id, skill_id, user_id: userId })));
    if (error) throw new Error(error.message);
  }

  const evidence = ward.evidence ?? [];
  const { error: clearError } = await supabase
    .from("evidence")
    .delete()
    .eq("ward_id", ward.id);
  if (clearError) throw new Error(clearError.message);
  if (evidence.length) {
    const { error } = await supabase.from("evidence").insert(
      evidence.map((e) => ({
        id: e.id,
        ward_id: ward.id,
        user_id: userId,
        kind: e.kind,
        label: e.label,
        meta: e.meta ?? null,
      })),
    );
    if (error) throw new Error(error.message);
  }
}

export async function writeOnWard(userId: string, ward: OnWard) {
  const { error } = await supabase.from("on_wards").upsert(
    {
      id: ward.id,
      user_id: userId,
      title: ward.title,
      impact: ward.impact,
      body: ward.body ?? null,
      project: ward.project ?? null,
      day: ward.date ?? null,
      in_portfolio: ward.inPortfolio,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
  await writeWardLinks(userId, ward);
}

export async function setWardInPortfolio(id: string, inPortfolio: boolean) {
  const { error } = await supabase.from("on_wards").update({ in_portfolio: inPortfolio }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function writeSkill(userId: string, name: string) {
  await skillIdsFor(userId, [name]);
}

export async function writeSettings(userId: string, settings: Settings) {
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        theme: settings.theme,
        notifications: settings.notifications,
        weekly_digest: settings.weeklyDigest,
        haptics: settings.haptics,
        reduced_motion: settings.reducedMotion,
        default_reminder_time: settings.defaultReminderTime,
      },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(error.message);
}

export async function saveProfile(userId: string, patch: Partial<Omit<Profile, "id" | "plan">>) {
  const row: Record<string, unknown> = {};
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.initials !== undefined) row.initials = patch.initials;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  if (!Object.keys(row).length) return;
  // Update only: an upsert puts `id` in the ON CONFLICT SET list, and the
  // client role is deliberately not allowed to write that column.
  const { error } = await supabase.from("profiles").update(row).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteRow(table: "tasks" | "notes" | "on_wards", id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// --------------------------------------------------------------------- activity

/** Counts one piece of real usage for streaks, heatmaps and insights. */
export async function recordActivity(kind: "task" | "ward" | "note", day?: string) {
  const { error } = await supabase.rpc("record_activity", {
    p_kind: kind,
    p_day: day ?? toISO(new Date()),
  });
  if (error) throw new Error(error.message);
}

export async function fetchActivity(
  userId: string,
  since: string,
): Promise<{ days: ActivityDay[]; streak: StreakStats }> {
  const [daysRes, streakRes] = await Promise.all([
    supabase
      .from("activity_days")
      .select("day, task_count, ward_count, note_count")
      .eq("user_id", userId)
      .gte("day", since)
      .order("day"),
    supabase
      .from("streaks")
      .select("current, longest, days_using")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  fail(daysRes.error, streakRes.error);
  const rows: { day: string; task_count: number; ward_count: number; note_count: number }[] =
    daysRes.data ?? [];
  const streak = streakRes.data as
    | { current: number; longest: number; days_using: number }
    | null;
  return {
    days: rows.map((row) => ({
      day: row.day,
      taskCount: row.task_count,
      wardCount: row.ward_count,
      noteCount: row.note_count,
    })),
    streak: {
      current: streak?.current ?? 0,
      longest: streak?.longest ?? 0,
      daysUsing: streak?.days_using ?? 0,
    },
  };
}

// ------------------------------------------------------------------ leaderboard

export async function fetchLeaderboard(period: "week" | "month" | "all"): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("leaderboard", { p_period: period });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as {
    place: number;
    user_id: string;
    display_name: string;
    initials: string;
    streak: number;
    on_wards: number;
  }[];
  return rows.map((row) => ({
    place: Number(row.place),
    userId: row.user_id,
    name: row.display_name,
    initials: row.initials,
    streak: row.streak,
    onWards: Number(row.on_wards),
  }));
}

// -------------------------------------------------------------------- referrals

export async function fetchMyReferrals(): Promise<MyReferrals | null> {
  const { data, error } = await supabase.rpc("my_referrals");
  if (error) throw new Error(error.message);
  if (!data) return null;
  const payload = data as {
    code: string;
    credits: number;
    pro_until: string | null;
    referrals: { name: string; initials: string | null; status: "joined" | "qualified"; joined: string }[];
  };
  return {
    code: payload.code,
    credits: payload.credits,
    proUntil: payload.pro_until,
    referrals: (payload.referrals ?? []).map((r) => ({
      name: r.name,
      initials: r.initials ?? initialsFor(r.name),
      status: r.status,
      joined: r.joined,
    })),
  };
}

export async function redeemReferral(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("redeem_referral", { p_code: code });
  if (error) return false;
  return data === true;
}
