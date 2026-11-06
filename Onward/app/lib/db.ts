import { supabase } from "./supabase";
import {
  DEFAULT_SETTINGS,
  type Evidence,
  type OnWard,
  type Plan,
  type Settings,
} from "./data";
import { toISO, wardDateLabel } from "./dates";
import { EMPTY_CV_DOC, type CvDoc } from "./cv";

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
  wardCount: number;
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
  onWards: OnWard[];
  skills: string[];
  settings: Settings;
  plan: Plan;
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
  const [wardsRes, skillsRes, settingsRes, profileRes] = await Promise.all([
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

  fail(wardsRes.error, skillsRes.error, settingsRes.error, profileRes.error);

  const wards: WardRow[] = wardsRes.data ?? [];
  const skillRows: { name: string }[] = skillsRes.data ?? [];
  const settingsRow = (settingsRes.data ?? null) as SettingsRow | null;

  return {
    onWards: wards.map(wardFromRow),
    skills: skillRows.map((s) => s.name),
    settings: settingsFromRow(settingsRow),
    plan: effectivePlan(
      ((profileRes.data as { plan?: Plan } | null)?.plan ?? "free") as Plan,
      (profileRes.data as { pro_until?: string | null } | null)?.pro_until,
    ),
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
  };
}

// ------------------------------------------------------------------------ writing

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
      },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(error.message);
}

/** The CV's hand-typed extras. Returns an empty doc until the cv column exists. */
export async function fetchCvDoc(userId: string): Promise<CvDoc> {
  const { data, error } = await supabase.from("user_settings").select("cv").eq("user_id", userId).maybeSingle();
  if (error || !data?.cv) return EMPTY_CV_DOC;
  return { ...EMPTY_CV_DOC, ...(data.cv as Partial<CvDoc>) };
}

/**
 * The row may not exist yet, and the other columns are NOT NULL with defaults, so an
 * upsert on the key alone is what an owner is allowed to do here.
 */
export async function saveCvDoc(userId: string, doc: CvDoc) {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, cv: doc }, { onConflict: "user_id" });
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

export async function deleteRow(table: "on_wards", id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------------ feed

export const POST_MEDIA_BUCKET = "post-media";
export const POST_MEDIA_MAX_BYTES = 26_214_400;
export const POST_MEDIA_MAX_PER_POST = 4;
export const POST_BODY_MAX = 2000;
export const POST_COMMENT_MAX = 500;

/** Kept in step with the bucket's allowed_mime_types, so a pick the server would
 *  refuse never reaches an upload. */
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export type PostMedia = {
  id: string;
  kind: "image" | "video";
  path: string;
  bytes: number | null;
};

export type PostComment = {
  id: string;
  body: string;
  firstName: string;
  initials: string;
  createdAt: string;
  mine: boolean;
};

export type FeedPost = {
  id: string;
  body: string;
  wardId: string | null;
  firstName: string;
  initials: string;
  avatarUrl: string | null;
  role: string | null;
  createdAt: string;
  mine: boolean;
  media: PostMedia[];
  likes: number;
  comments: number;
  recentComments: PostComment[];
};

type CommentJson = {
  id: string;
  body: string;
  first_name: string | null;
  initials: string | null;
  created_at: string;
  mine?: boolean | null;
};

type FeedRow = {
  id: string;
  body: string;
  ward_id: string | null;
  first_name: string | null;
  initials: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
  mine: boolean | null;
  media: PostMedia[] | null;
  likes: number | null;
  comments: number | null;
  recent_comments: CommentJson[] | null;
};

function commentFromJson(row: CommentJson): PostComment {
  return {
    id: row.id,
    body: row.body,
    firstName: row.first_name ?? "",
    initials: row.initials ?? "",
    createdAt: row.created_at,
    mine: row.mine ?? false,
  };
}

function postFromRow(row: FeedRow): FeedPost {
  return {
    id: row.id,
    body: row.body,
    wardId: row.ward_id,
    firstName: row.first_name ?? "",
    initials: row.initials ?? "",
    avatarUrl: row.avatar_url ?? null,
    role: row.role ?? null,
    createdAt: row.created_at,
    mine: row.mine ?? false,
    media: row.media ?? [],
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    recentComments: (row.recent_comments ?? []).map(commentFromJson),
  };
}

const FEED_COLUMNS =
  "id, body, ward_id, first_name, initials, avatar_url, role, created_at, mine, media, likes, comments, recent_comments";

/** A public object in a public bucket needs no token, which is what lets an <img>
 *  tag work for someone who has never signed in. */
export function mediaUrl(path: string): string {
  return supabase.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Reads the feed view: everything a stranger is allowed to see, in one round trip. */
export async function fetchFeed(limit = 40): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select(FEED_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as FeedRow[] | null ?? []).map(postFromRow);
}

export async function fetchPost(id: string): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select(FEED_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? postFromRow(data as FeedRow) : null;
}

export async function fetchComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from("feed_comments")
    .select("id, body, first_name, initials, created_at, mine")
    .eq("post_id", postId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data as CommentJson[] | null ?? []).map(commentFromJson);
}

/**
 * The posts you have liked. RLS hands back your own rows and nothing else, so this is
 * a list of yours rather than anyone else's - and it is empty for a visitor.
 */
export async function fetchMyLikes(): Promise<Set<string>> {
  const { data, error } = await supabase.from("post_likes").select("post_id");
  if (error) throw new Error(error.message);
  return new Set((data as { post_id: string }[] | null ?? []).map((row) => row.post_id));
}

export async function likePost(postId: string) {
  const { error } = await supabase.from("post_likes").insert({ post_id: postId });
  if (error) throw new Error(error.message);
}

export async function unlikePost(postId: string) {
  const { error } = await supabase.from("post_likes").delete().eq("post_id", postId);
  if (error) throw new Error(error.message);
}

export async function addComment(
  postId: string,
  body: string,
): Promise<{ id: string; createdAt: string }> {
  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, body })
    .select("id, created_at")
    .single();
  fail(error);
  if (!data) throw new Error("The comment did not land");
  return { id: data.id as string, createdAt: data.created_at as string };
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("post_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePost(id: string) {
  // The Storage API is the only way a file can actually leave the bucket - Supabase
  // rejects a direct delete on its own tables. So the files go first, and if any of
  // them refuses to go the post stays up rather than vanishing with something still
  // public behind it.
  const { data: picked } = await supabase
    .from("post_media")
    .select("storage_path")
    .eq("post_id", id);
  const paths = (picked as { storage_path: string }[] | null ?? []).map((row) => row.storage_path);
  if (paths.length) {
    const { error: removeError } = await supabase.storage.from(POST_MEDIA_BUCKET).remove(paths);
    if (removeError) throw new Error(removeError.message);
  }
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Why a pick was refused, in the words the composer shows. */
export function mediaProblem(files: File[]): string | null {
  if (files.length > POST_MEDIA_MAX_PER_POST) {
    return `A post takes up to ${POST_MEDIA_MAX_PER_POST} photos or clips.`;
  }
  for (const file of files) {
    if (!EXT_BY_TYPE[file.type]) return `That file type is not supported (${file.type || "unknown"}).`;
    if (file.size > POST_MEDIA_MAX_BYTES) return `"${file.name}" is over the 25MB limit.`;
  }
  return null;
}

async function signedInUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Sign in to post");
  return id;
}

/**
 * The post row goes first so its id can name the folders the files land in. If an
 * upload fails the files that went up are deleted and the row with them - no
 * half-published post, and nothing left in storage that no post points at.
 */
export async function createPost(input: {
  body: string;
  files: File[];
  wardId?: string | null;
  onProgress?: (done: number, total: number) => void;
}): Promise<FeedPost> {
  const { body, files, wardId = null, onProgress } = input;
  const problem = mediaProblem(files);
  if (problem) throw new Error(problem);
  if (!body.trim() && !files.length) throw new Error("A post needs words or a photo");

  const userId = await signedInUserId();
  const { data: created, error: createError } = await supabase
    .from("posts")
    .insert({ body, ward_id: wardId })
    .select("id")
    .single();
  if (createError) throw new Error(createError.message);
  const postId = created.id as string;

  const paths: string[] = [];
  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      // Only ids and a whitelisted extension go into the path, never file names.
      const path = `${userId}/${postId}/${index}.${EXT_BY_TYPE[file.type]}`;
      const { error } = await supabase.storage
        .from(POST_MEDIA_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      paths.push(path);
      onProgress?.(index + 1, files.length);
    }
    if (paths.length) {
      const { error } = await supabase.from("post_media").insert(
        files.map((file, index) => ({
          post_id: postId,
          kind: file.type.startsWith("video/") ? "video" : "image",
          storage_path: paths[index],
          bytes: file.size,
          sort: index,
        })),
      );
      if (error) throw new Error(error.message);
    }
  } catch (error) {
    // Anything that did go up is removed by name, and the row delete takes the rest.
    if (paths.length) await supabase.storage.from(POST_MEDIA_BUCKET).remove(paths);
    await supabase.from("posts").delete().eq("id", postId);
    throw error instanceof Error ? error : new Error("Upload failed");
  }

  const post = await fetchPost(postId);
  if (!post) throw new Error("The post did not come back");
  return post;
}

// --------------------------------------------------------------------- activity

/** Marks a day used so streaks, heatmaps and insights can count it. */
export async function recordActivity(day?: string) {
  const { error } = await supabase.rpc("record_activity", {
    p_kind: "ward",
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
      .select("day, ward_count")
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
  const rows: { day: string; ward_count: number }[] = daysRes.data ?? [];
  const streak = streakRes.data as
    | { current: number; longest: number; days_using: number }
    | null;
  return {
    days: rows.map((row) => ({ day: row.day, wardCount: row.ward_count })),
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
