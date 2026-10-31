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
};

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
    plan: row.plan,
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
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
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
    plan: (profileRes.data as { plan?: Plan } | null)?.plan ?? "free",
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
  const row: Record<string, unknown> = { id: userId };
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.initials !== undefined) row.initials = patch.initials;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

export async function deleteRow(table: "tasks" | "notes" | "on_wards", id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
