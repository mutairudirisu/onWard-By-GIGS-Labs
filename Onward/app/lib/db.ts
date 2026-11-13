import { supabase } from "./supabase";
import {
  DEFAULT_SETTINGS,
  type Evidence,
  type OnWard,
  type Plan,
  type Settings,
  type Theme,
} from "./data";
import { toISO, wardDateLabel } from "./dates";
import { EMPTY_CV_DOC, normalizeCvDoc, type CvDoc } from "./cv";

export type Profile = {
  id: string;
  displayName: string;
  username: string | null;
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
  evidenceWardsUsed: number;
  evidenceEntitlementWardIds: string[];
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
  url: string | null;
  storage_path: string | null;
};

type SettingsRow = {
  user_id: string;
  theme: Theme;
  notifications: boolean;
  weekly_digest: boolean;
  haptics: boolean;
  reduced_motion: boolean;
};

type ProfileRow = {
  id: string;
  display_name: string;
  username: string | null;
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
  const first = Array.from(parts[0] ?? "")[0] ?? "";
  const second = Array.from(parts[1] ?? "")[0] ?? "";
  return `${first}${second}`.toUpperCase();
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
    username: row.username ?? null,
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
  const [wardsRes, skillsRes, settingsRes, profileRes, entitlementRes] = await Promise.all([
    supabase
      .from("on_wards")
      .select("*, ward_skills(skill_id, skills(name)), evidence(id, kind, label, meta, url, storage_path)")
      .eq("user_id", userId)
      .order("day", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("skills").select("name").eq("user_id", userId).order("created_at"),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("profiles")
      .select("plan, pro_until, evidence_wards_used")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("ward_evidence_entitlements")
      .select("ward_id")
      .eq("user_id", userId),
  ]);

  fail(wardsRes.error, skillsRes.error, settingsRes.error, profileRes.error, entitlementRes.error);

  const wards: WardRow[] = wardsRes.data ?? [];
  const skillRows: { name: string }[] = skillsRes.data ?? [];
  const settingsRow = (settingsRes.data ?? null) as SettingsRow | null;
  const entitlementRows: { ward_id: string }[] = entitlementRes.data ?? [];
  const profileRow = profileRes.data as {
    plan?: Plan;
    pro_until?: string | null;
    evidence_wards_used?: number;
  } | null;

  return {
    onWards: wards.map(wardFromRow),
    skills: skillRows.map((s) => s.name),
    settings: settingsFromRow(settingsRow),
    plan: effectivePlan(
      (profileRow?.plan ?? "free") as Plan,
      profileRow?.pro_until,
    ),
    evidenceWardsUsed: profileRow?.evidence_wards_used ?? 0,
    evidenceEntitlementWardIds: entitlementRows.map((row) => row.ward_id),
  };
}

function wardFromRow(row: WardRow): OnWard {
  const evidence = (row.evidence ?? []).map(
    (e): Evidence => ({
      id: e.id,
      kind: e.kind,
      label: e.label,
      meta: e.meta ?? undefined,
      url: e.url ?? (e.kind === "url" ? e.meta ?? undefined : undefined),
      storagePath: e.storage_path ?? undefined,
    }),
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
  const { data: previousEvidence, error: previousEvidenceError } = await supabase
    .from("evidence")
    .select("storage_path")
    .eq("ward_id", ward.id);
  if (previousEvidenceError) throw new Error(previousEvidenceError.message);
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
        url: e.url ?? null,
        storage_path: e.storagePath ?? null,
      })),
    );
    if (error) throw new Error(error.message);
  }

  const retainedPaths = new Set(
    evidence
      .map((item) => item.storagePath)
      .filter((path): path is string => typeof path === "string"),
  );
  const removedPaths = (previousEvidence ?? [])
    .map((item: { storage_path: string | null }) => item.storage_path)
    .filter((path): path is string => path !== null && !retainedPaths.has(path));
  if (removedPaths.length) {
    try {
      await removeWardEvidenceFiles(removedPaths);
    } catch (error) {
      console.error("Saved onWard evidence changes but could not delete removed files", error);
    }
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

/** The CV's saved manual details. */
export async function fetchCvDoc(userId: string): Promise<CvDoc> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("cv")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return normalizeCvDoc(data?.cv ?? EMPTY_CV_DOC);
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
  if (patch.username !== undefined) row.username = patch.username;
  if (patch.initials !== undefined) row.initials = patch.initials;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  if (!Object.keys(row).length) return;
  // Update only: an upsert puts `id` in the ON CONFLICT SET list, and the
  // client role is deliberately not allowed to write that column.
  const { error } = await supabase.from("profiles").update(row).eq("id", userId);
  if (error?.code === "23505") throw new Error("That username is already taken.");
  if (error) throw new Error(error.message);
}

export async function deleteRow(table: "on_wards", id: string) {
  const { data: evidence, error: evidenceError } = await supabase
    .from("evidence")
    .select("storage_path")
    .eq("ward_id", id);
  if (evidenceError) throw new Error(evidenceError.message);
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  const paths = (evidence ?? [])
    .map((row: { storage_path: string | null }) => row.storage_path)
    .filter((path): path is string => Boolean(path));
  if (paths.length) {
    try {
      await removeWardEvidenceFiles(paths);
    } catch (cleanupError) {
      console.error("Deleted an onWard but could not remove its stored evidence", cleanupError);
    }
  }
}

export const WARD_EVIDENCE_BUCKET = "ward-evidence";
export const WARD_EVIDENCE_MAX_BYTES = 26_214_400;

const WARD_EVIDENCE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

export async function uploadWardEvidence(
  userId: string,
  evidenceId: string,
  file: File,
): Promise<string> {
  if (file.size > WARD_EVIDENCE_MAX_BYTES) throw new Error("Keep attachments under 25 MB.");
  if (!WARD_EVIDENCE_MIME_TYPES.has(file.type)) {
    throw new Error("Choose an image, PDF, Word, PowerPoint or text file.");
  }
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
  const path = `${userId}/${evidenceId}.${extension}`;
  const { error } = await supabase.storage
    .from(WARD_EVIDENCE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedWardEvidenceUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(WARD_EVIDENCE_BUCKET)
    .createSignedUrl(path, 86_400);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function removeWardEvidenceFiles(paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(WARD_EVIDENCE_BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------------ feed

export const POST_MEDIA_BUCKET = "post-media";
export const COMMUNITY_MEDIA_BUCKET = "community-media";
export const POST_MEDIA_MAX_BYTES = 26_214_400;
export const POST_MEDIA_MAX_PER_POST = 10;
const POST_DOCUMENT_EXTENSIONS: Record<string, { extension: string; mime: string }> = {
  "application/pdf": { extension: "pdf", mime: "application/pdf" },
  "application/msword": { extension: "doc", mime: "application/msword" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extension: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  "application/vnd.ms-powerpoint": { extension: "ppt", mime: "application/vnd.ms-powerpoint" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    extension: "pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  "text/plain": { extension: "txt", mime: "text/plain" },
};
export const POST_BODY_MAX = 2000;
export const POST_TITLE_MAX = 140;
export const POST_COMMENT_MAX = 500;
export const POST_POLL_QUESTION_MAX = 200;
export const POST_POLL_OPTION_MAX = 120;
export const POST_POLL_MIN_OPTIONS = 2;
export const POST_POLL_MAX_OPTIONS = 6;
/** The shortest and longest runs a poll can be given, kept in step with create_poll. */
export const POST_POLL_MIN_MS = 10 * 60_000;
export const POST_POLL_MAX_MS = 30 * 86_400_000;

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
  fullName: string;
  initials: string;
  createdAt: string;
  mine: boolean;
  likes: number;
  liked: boolean;
};

/** The poll a reshare carries: a question and its counts to read, never a vote to cast
 *  from inside somebody else's card. Tapping the box opens the post that holds it. */
export type CarriedPoll = {
  id: string;
  question: string;
  endsAt: string;
  closed: boolean;
  total: number;
  options: PollOption[];
};

/** The entry a reshare carries. It is the original, not a copy of the whole card:
 *  no counts, no thread, and nothing to reshare again from inside it. */
export type ResharedEntry = {
  id: string;
  title: string;
  body: string;
  fullName: string;
  initials: string;
  avatarUrl: string | null;
  /** Who wrote it, so the carried card can lead to their profile. */
  authorId: string | null;
  createdAt: string;
  media: PostMedia[];
  poll: CarriedPoll | null;
};

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  wardId: string | null;
  fullName: string;
  initials: string;
  avatarUrl: string | null;
  role: string | null;
  createdAt: string;
  mine: boolean;
  /** The author's account, for the profile link. Null until the feed view exposes it. */
  authorId: string | null;
  media: PostMedia[];
  likes: number;
  comments: number;
  recentComments: PostComment[];
  reshares: number;
  reshared: boolean;
  /** Set on a repost: whose entry this is passing on. */
  reshareOf: string | null;
  reshare: ResharedEntry | null;
  audience?: "anyone" | "connections";
  commentAudience?: "anyone" | "connections" | "off";
  canComment?: boolean;
  brandPartnership?: boolean;
  brandPartnerName?: string;
  collaborators?: ExchangePerson[];
  communityId: string | null;
  communityName: string | null;
  communitySlug: string | null;
  communityTopic: CommunityTopic | null;
  communityDescription: string | null;
  communityAvatarPath: string | null;
  communityIsMember: boolean;
};

type CommentJson = {
  id: string;
  body: string;
  full_name: string | null;
  initials: string | null;
  created_at: string;
  mine?: boolean | null;
  likes?: number | null;
  liked?: boolean | null;
};

type ReshareJson = {
  id: string;
  title: string | null;
  body: string;
  full_name: string | null;
  initials: string | null;
  avatar_url: string | null;
  user_id?: string | null;
  created_at: string;
  media: PostMedia[] | null;
  poll?: {
    id: string;
    question: string;
    ends_at: string;
    closed: boolean | null;
    total: number | null;
    options: { id: string; label: string; sort: number; votes: number }[] | null;
  } | null;
};

type FeedRow = {
  id: string;
  body: string;
  title: string | null;
  ward_id: string | null;
  full_name: string | null;
  initials: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
  mine: boolean | null;
  /** Present once the feed view carries the author's account id. */
  author_id?: string | null;
  media: PostMedia[] | null;
  likes: number | null;
  comments: number | null;
  recent_comments: CommentJson[] | null;
  reshares: number | null;
  reshared: boolean | null;
  reshare_of: string | null;
  reshare: ReshareJson | null;
  post_audience?: "anyone" | "connections" | "channel" | null;
  comment_audience?: "anyone" | "connections" | "off" | null;
  can_comment?: boolean | null;
  brand_partnership?: boolean | null;
  brand_partner_name?: string | null;
  collaborators?: {
    id: string;
    name: string | null;
    initials: string | null;
    avatar_url: string | null;
  }[] | null;
  scheduled_at?: string | null;
  community_id?: string | null;
  community_name?: string | null;
  community_slug?: string | null;
  community_topic?: CommunityTopic | null;
  community_description?: string | null;
  community_avatar_path?: string | null;
  community_is_member?: boolean | null;
};

function commentFromJson(row: CommentJson): PostComment {
  return {
    id: row.id,
    body: row.body,
    fullName: row.full_name ?? "",
    initials: row.initials ?? "",
    createdAt: row.created_at,
    mine: row.mine ?? false,
    // The two newest replies carried on a card come from the view's jsonb, which
    // counts nothing, so they read as unliked rather than wrong.
    likes: row.likes ?? 0,
    liked: row.liked ?? false,
  };
}

function reshareFromJson(row: ReshareJson | null): ResharedEntry | null {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title ?? "",
    body: row.body,
    fullName: row.full_name ?? "",
    initials: row.initials ?? "",
    avatarUrl: row.avatar_url ?? null,
    authorId: row.user_id ?? null,
    createdAt: row.created_at,
    media: row.media ?? [],
    poll: row.poll
      ? {
          id: row.poll.id,
          question: row.poll.question,
          endsAt: row.poll.ends_at,
          closed: row.poll.closed ?? false,
          total: row.poll.total ?? 0,
          options: (row.poll.options ?? [])
            .slice()
            .sort((a, b) => a.sort - b.sort)
            .map((option) => ({ id: option.id, label: option.label, votes: option.votes })),
        }
      : null,
  };
}

function postFromRow(row: FeedRow): FeedPost {
  return {
    id: row.id,
    title: row.title ?? "",
    body: row.body,
    wardId: row.ward_id,
    fullName: row.full_name ?? "",
    initials: row.initials ?? "",
    avatarUrl: row.avatar_url ?? null,
    role: row.role ?? null,
    createdAt: row.scheduled_at ?? row.created_at,
    mine: row.mine ?? false,
    authorId: row.author_id ?? null,
    media: row.media ?? [],
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    recentComments: (row.recent_comments ?? []).map(commentFromJson),
    reshares: row.reshares ?? 0,
    reshared: row.reshared ?? false,
    reshareOf: row.reshare_of,
    reshare: reshareFromJson(row.reshare),
    audience: row.post_audience === "connections" || row.post_audience === "channel"
      ? "connections"
      : "anyone",
    commentAudience: row.comment_audience ?? "anyone",
    canComment: row.can_comment ?? true,
    brandPartnership: row.brand_partnership ?? false,
    brandPartnerName: row.brand_partner_name ?? "",
    collaborators: (row.collaborators ?? []).map((person) => ({
      id: person.id,
      name: person.name ?? "",
      initials: person.initials ?? "",
      avatarUrl: person.avatar_url,
      role: null,
    })),
    communityId: row.community_id ?? null,
    communityName: row.community_name ?? null,
    communitySlug: row.community_slug ?? null,
    communityTopic: row.community_topic ?? null,
    communityDescription: row.community_description ?? null,
    communityAvatarPath: row.community_avatar_path ?? null,
    communityIsMember: row.community_is_member ?? false,
  };
}

const FEED_COLUMNS =
  "id, body, ward_id, full_name, initials, avatar_url, role, created_at, mine, media, likes, comments, recent_comments, title, reshare_of, reshares, reshared, reshare, author_id, post_audience, comment_audience, can_comment, brand_partnership, brand_partner_name, collaborators, scheduled_at, community_id, community_name, community_slug, community_topic, community_is_member, community_description, community_avatar_path";

/** A public object in a public bucket needs no token, which is what lets an <img>
 *  tag work for someone who has never signed in. */
export function mediaUrl(path: string): string {
  return supabase.storage.from(POST_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadPostDocument(
  userId: string,
  file: File,
): Promise<{ path: string; url: string }> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const type =
    POST_DOCUMENT_EXTENSIONS[file.type] ??
    Object.values(POST_DOCUMENT_EXTENSIONS).find((candidate) => candidate.extension === extension);
  if (!type) throw new Error("Choose a PDF, Word document, PowerPoint or text file.");
  if (file.size > POST_MEDIA_MAX_BYTES) throw new Error("Keep documents under 25MB.");
  const path = `${userId}/documents/${uuid()}.${type.extension}`;
  const { error } = await supabase.storage
    .from(POST_MEDIA_BUCKET)
    .upload(path, file, { contentType: type.mime, upsert: false });
  if (error) throw new Error(error.message);
  return { path, url: mediaUrl(path) };
}

export async function removePostDocument(path: string): Promise<void> {
  const { error } = await supabase.storage.from(POST_MEDIA_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

/** The one photo a profile shows. It lives in the owner's own folder of the
 *  post-media bucket, so the same insert policy covers it, and the stamp keeps
 *  caches from showing the face that was there before. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage
    .from(POST_MEDIA_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  return `${mediaUrl(path)}?v=${Date.now()}`;
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

/** What the Exchange tab badge needs: a number, not another page of rows. */
export async function countNewExchangePosts(sinceIso: string): Promise<number> {
  const { count, error } = await supabase
    .from("feed_posts")
    .select("id", { count: "exact", head: true })
    .eq("mine", false)
    .gt("created_at", sinceIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
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
    .select("id, body, full_name, initials, created_at, mine, likes, liked")
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

export type FeedInteraction = {
  id: string;
  postId: string;
  kind: "like" | "comment";
  body: string;
  createdAt: string;
};

/**
 * What the reader has done in the feed, newest first, at most one line per post.
 * Both halves are their own rows - likes are already own-only under RLS, and the
 * view's mine flag is false for a visitor - so the strip above the timeline can
 * only ever show things that really happened.
 */
export async function fetchMyInteractions(limit = 6): Promise<FeedInteraction[]> {
  const [liked, mine] = await Promise.all([
    supabase
      .from("post_likes")
      .select("post_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("feed_comments")
      .select("id, post_id, body, created_at")
      .eq("mine", true)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);
  if (liked.error) throw new Error(liked.error.message);
  if (mine.error) throw new Error(mine.error.message);

  const rows: FeedInteraction[] = (
    (liked.data as { post_id: string; created_at: string }[] | null ?? []).map((row) => ({
      id: `like:${row.post_id}`,
      postId: row.post_id,
      kind: "like" as const,
      body: "",
      createdAt: row.created_at,
    }) as FeedInteraction).concat(
      (mine.data as { id: string; post_id: string; body: string; created_at: string }[] | null ?? [])
        .map((row) => ({
          id: `comment:${row.id}`,
          postId: row.post_id,
          kind: "comment" as const,
          body: row.body,
          createdAt: row.created_at,
        }) as FeedInteraction),
    )
  ).sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

  const seen = new Set<string>();
  const out: FeedInteraction[] = [];
  for (const row of rows) {
    if (seen.has(row.postId)) continue;
    seen.add(row.postId);
    out.push(row);
    if (out.length === limit) break;
  }
  return out;
}

export async function likePost(postId: string) {
  const { error } = await supabase.from("post_likes").insert({ post_id: postId });
  if (error) throw new Error(error.message);
}

export async function unlikePost(postId: string) {
  const { error } = await supabase.from("post_likes").delete().eq("post_id", postId);
  if (error) throw new Error(error.message);
}

/**
 * Passing someone's entry into your own stream. The row is yours and carries the pointer
 * plus whatever you chose to say about it, so the reshare count is a count of rows and
 * undoing it is a delete of your own row - the original is never touched. Most reposts
 * say nothing, which is why the thought is optional.
 */
export async function reshare(postId: string, thought = "") {
  const { error } = await supabase
    .from("posts")
    .insert({ reshare_of: postId, body: thought.trim().slice(0, POST_BODY_MAX) });
  if (error) throw new Error(error.message);
}

export async function unreshare(postId: string) {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("reshare_of", postId)
    .eq("user_id", await signedInUserId());
  if (error) throw new Error(error.message);
}

/** The two taps the feedback card offers. Anything finer asks too much of a tap. */
export type FeedbackAnswer = "love_it" | "not_really";

/**
 * One answer to the feedback card. The words are optional, so the row always carries
 * the tap; `screen` says where the question was asked, which is what makes a "not
 * really" from a first week mean something different from one after a month away.
 */
export async function sendFeedback(input: {
  answer: FeedbackAnswer;
  body: string;
  screen: string;
}) {
  const { error } = await supabase.from("feedback").insert({
    answer: input.answer,
    body: input.body.trim().slice(0, 1000),
    screen: input.screen,
  });
  if (error) throw new Error(error.message);
}

/** Someone in onWard the share drawer can hand a post to. */
export type ExchangePerson = {
  id: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  role: string | null;
};

export type SharedPost = {
  id: string;
  postId: string;
  createdAt: string;
  /** True when you handed it to somebody, false when it was handed to you. */
  mine: boolean;
  fromName: string;
  fromInitials: string;
  fromAvatarUrl: string | null;
  toName: string;
  post: ResharedEntry;
};

type PersonJson = {
  id: string;
  display_name: string | null;
  initials: string | null;
  avatar_url: string | null;
  role: string | null;
};

type ShareRow = {
  id: string;
  post_id: string;
  created_at: string;
  mine: boolean | null;
  from_name: string | null;
  from_initials: string | null;
  from_avatar_url: string | null;
  to_name: string | null;
  post: ReshareJson | null;
};

/**
 * The picker's list. Empty query is the pull the drawer opens with; the function leaves
 * out your own row, so nobody is offered a post they wrote.
 */
export async function searchPeople(query = ""): Promise<ExchangePerson[]> {
  const { data, error } = await supabase.rpc("search_people", { p_query: query });
  fail(error);
  return (data as PersonJson[] | null ?? []).map(
    (row) =>
      ({
        id: row.id,
        name: row.display_name ?? "",
        initials: row.initials ?? "",
        avatarUrl: row.avatar_url,
        role: row.role,
      }) as ExchangePerson,
  );
}

/**
 * Handing the post to one person. The row names the original rather than copying it, so
 * there is one post and one thread, and a second tap for the same pair changes nothing.
 */
export async function sharePostWith(postId: string, userId: string) {
  const { error } = await supabase
    .from("post_shares")
    .upsert(
      { post_id: postId, to_user: userId },
      { onConflict: "post_id,from_user,to_user", ignoreDuplicates: true },
    );
  fail(error);
}

export async function unsharePostFrom(postId: string, userId: string) {
  const { error } = await supabase
    .from("post_shares")
    .delete()
    .eq("post_id", postId)
    .eq("to_user", userId)
    .eq("from_user", await signedInUserId());
  fail(error);
}

/** Who you have already handed this post to, so the drawer can show it on the name. */
export async function fetchSharesFor(postId: string): Promise<Set<string>> {
  const me = await signedInUserId();
  const { data, error } = await supabase
    .from("post_shares")
    .select("to_user")
    .eq("post_id", postId)
    .eq("from_user", me);
  fail(error);
  return new Set((data as { to_user: string }[] | null ?? []).map((row) => row.to_user));
}

/** The newest posts other people handed to you, newest first. */
export async function fetchSharedWithMe(limit = 5): Promise<SharedPost[]> {
  const { data, error } = await supabase
    .from("feed_shares")
    .select(
      "id, post_id, created_at, mine, from_name, from_initials, from_avatar_url, to_name, post",
    )
    .eq("mine", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  fail(error);
  return (data as ShareRow[] | null ?? []).flatMap((row) => {
    const post = reshareFromJson(row.post);
    if (!post) return [];
    return [
      {
        id: row.id,
        postId: row.post_id,
        createdAt: row.created_at,
        mine: row.mine ?? false,
        fromName: row.from_name ?? "",
        fromInitials: row.from_initials ?? "",
        fromAvatarUrl: row.from_avatar_url,
        toName: row.to_name ?? "",
        post,
      } as SharedPost,
    ];
  });
}

export async function likeComment(commentId: string) {
  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId });
  if (error) throw new Error(error.message);
}

export async function unlikeComment(commentId: string) {
  const { error } = await supabase
    .from("comment_likes")
    .delete()
    .eq("comment_id", commentId);
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
  const { data: documents, error: documentError } = await supabase
    .from("post_documents")
    .select("storage_path")
    .eq("post_id", id);
  if (documentError) throw new Error(documentError.message);
  const documentPaths = (documents as { storage_path: string }[] | null ?? []).map(
    (row) => row.storage_path,
  );
  const allPaths = [...paths, ...documentPaths];
  if (allPaths.length) {
    const { error: removeError } = await supabase.storage.from(POST_MEDIA_BUCKET).remove(allPaths);
    if (removeError) throw new Error(removeError.message);
  }
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ------------------------------------------------------------------------ polls

/** One choice, with the votes it has. Never a share - the card works that out. */
export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type PostPoll = {
  id: string;
  postId: string;
  question: string;
  endsAt: string;
  closed: boolean;
  total: number;
  myOptionId: string | null;
  options: PollOption[];
};

/** What the composer sends: the choices as text, and the instant the poll shuts. */
export type PollDraft = {
  question: string;
  options: string[];
  endsAt: string;
};

type PollJson = {
  id: string;
  post_id: string;
  question: string;
  ends_at: string;
  closed: boolean | null;
  total: number | null;
  my_option_id: string | null;
  options: { id: string; label: string; sort: number; votes: number }[] | null;
};

function pollFromJson(row: PollJson): PostPoll {
  return {
    id: row.id,
    postId: row.post_id,
    question: row.question,
    endsAt: row.ends_at,
    closed: row.closed ?? false,
    total: row.total ?? 0,
    myOptionId: row.my_option_id ?? null,
    options: (row.options ?? [])
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .map((option) => ({ id: option.id, label: option.label, votes: option.votes })),
  };
}

/**
 * The polls for these posts, keyed by post id. A separate read from a separate view, so
 * the feed answers on its own and the page simply finds no polls when the migration has
 * not run yet.
 */
export async function fetchPolls(postIds: string[]): Promise<Record<string, PostPoll>> {
  if (!postIds.length) return {};
  const { data, error } = await supabase
    .from("feed_polls")
    .select("id, post_id, question, ends_at, closed, total, my_option_id, options")
    .in("post_id", postIds);
  fail(error);
  const out: Record<string, PostPoll> = {};
  for (const row of data as PollJson[] | null ?? []) out[row.post_id] = pollFromJson(row);
  return out;
}

/**
 * Why a poll was refused, before the post goes up. The database says no to the same
 * things inside create_poll; saying it here saves an author from a post that is created
 * and then deleted in front of them.
 */
export function pollProblem(poll: PollDraft): string | null {
  const question = poll.question.trim();
  if (!question) return "A poll needs a question.";
  if (question.length > POST_POLL_QUESTION_MAX)
    return `The question is over ${POST_POLL_QUESTION_MAX} characters.`;
  const labels = poll.options.map((option) => option.trim()).filter(Boolean);
  if (labels.length < POST_POLL_MIN_OPTIONS)
    return `A poll takes at least ${POST_POLL_MIN_OPTIONS} choices.`;
  if (labels.length > POST_POLL_MAX_OPTIONS)
    return `A poll takes up to ${POST_POLL_MAX_OPTIONS} choices.`;
  if (labels.some((label) => label.length > POST_POLL_OPTION_MAX))
    return `A choice is over ${POST_POLL_OPTION_MAX} characters.`;
  if (new Set(labels.map((label) => label.toLowerCase())).size !== labels.length)
    return "Two of the choices say the same thing.";
  const ms = Date.parse(poll.endsAt) - Date.now();
  if (!Number.isFinite(ms)) return "The poll needs a time it closes at.";
  if (ms < POST_POLL_MIN_MS) return "A poll stays open for at least ten minutes.";
  if (ms > POST_POLL_MAX_MS) return "A poll closes within thirty days.";
  return null;
}

/**
 * Voting, or changing your mind. One row per person per poll is the whole rule, and it
 * lives in the database - so a vote after the close is refused wherever it comes from.
 */
export async function voteInPoll(optionId: string): Promise<void> {
  const { error } = await supabase.rpc("vote_in_poll", { p_option_id: optionId });
  fail(error);
}

/** The poll that goes with a new post. create_poll makes the rows; here it is only called. */
async function createPoll(postId: string, poll: PollDraft): Promise<void> {
  const { error } = await supabase.rpc("create_poll", {
    p_post_id: postId,
    p_question: poll.question.trim(),
    p_options: poll.options.map((option) => option.trim()).filter(Boolean),
    p_ends_at: poll.endsAt,
  });
  fail(error);
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
 * upload or the poll fails the files that went up are deleted and the row with them - no
 * half-published post, and nothing left in storage that no post points at.
 */
export async function createPost(input: {
  title?: string;
  body: string;
  files: File[];
  wardId?: string | null;
  communityId?: string | null;
  audience?: "anyone" | "connections";
  commentAudience?: "anyone" | "connections" | "off";
  collaboratorIds?: string[];
  brandPartnerName?: string | null;
  poll?: PollDraft | null;
  documentPath?: string | null;
  scheduledAt?: string | null;
  onProgress?: (done: number, total: number) => void;
}): Promise<FeedPost | null> {
  const {
    title = "",
    body,
    files,
    wardId = null,
    communityId = null,
    audience = "anyone",
    commentAudience = "anyone",
    collaboratorIds = [],
    brandPartnerName = null,
    poll = null,
    documentPath = null,
    scheduledAt = null,
    onProgress,
  } = input;
  if (scheduledAt && (!Number.isFinite(Date.parse(scheduledAt)) || Date.parse(scheduledAt) <= Date.now())) {
    throw new Error("Choose a future date and time for your post.");
  }
  const problem = mediaProblem(files);
  if (problem) throw new Error(problem);
  if (poll) {
    const why = pollProblem(poll);
    if (why) throw new Error(why);
  }
  if (audience !== "anyone" && (files.length || documentPath)) {
    throw new Error("Private post audiences are not available with media or document attachments yet.");
  }
  if (communityId && audience !== "anyone") {
    throw new Error("Community posts must be visible to everyone.");
  }
  if (collaboratorIds.length > 5) throw new Error("Tag up to five collaborators.");
  const partnershipName = brandPartnerName?.trim() ?? "";
  if (partnershipName.length > 120) throw new Error("Keep the brand partner name under 120 characters.");
  if (!title.trim() && !body.trim() && !files.length && !poll?.question.trim())
    throw new Error("An Exchange entry needs a headline, words, a photo or a poll");

  const userId = await signedInUserId();
  const { data: created, error: createError } = await supabase
    .from("posts")
    .insert({
      title: title.trim(),
      body,
      ward_id: wardId,
      community_id: communityId,
      audience,
      comment_audience: commentAudience,
      brand_partnership: Boolean(partnershipName),
      brand_partner_name: partnershipName,
      scheduled_at: scheduledAt,
    })
    .select("id")
    .single();
  if (createError) throw new Error(createError.message);
  const postId = created.id as string;

  const paths: string[] = [];
  try {
    if (collaboratorIds.length) {
      const { error } = await supabase.from("post_collaborators").insert(
        collaboratorIds.map((userId) => ({ post_id: postId, user_id: userId })),
      );
      if (error) throw new Error(error.message);
    }
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
    if (documentPath) {
      const { error } = await supabase.from("post_documents").insert({
        post_id: postId,
        storage_path: documentPath,
      });
      if (error) throw new Error(error.message);
    }
    // The poll goes last: it is the part most likely to be refused, and the delete
    // below takes the post with it.
    if (poll) await createPoll(postId, poll);
  } catch (error) {
    // Anything that did go up is removed by name, and the row delete takes the rest.
    if (paths.length) await supabase.storage.from(POST_MEDIA_BUCKET).remove(paths);
    await supabase.from("posts").delete().eq("id", postId);
    throw error instanceof Error ? error : new Error("Upload failed");
  }

  if (scheduledAt) return null;

  const post = await fetchPost(postId);
  if (!post) {
    if (poll) await supabase.from("posts").delete().eq("id", postId);
    throw new Error("The post did not come back");
  }
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

// ------------------------------------------------------- Exchange people and rooms

/** A person as the Exchange shows them: the header of their profile, with its numbers. */
export type ProfileCard = {
  id: string;
  fullName: string;
  username: string | null;
  initials: string;
  avatarUrl: string | null;
  role: string | null;
  location: string | null;
  bio: string | null;
  joinedAt: string;
  mine: boolean;
  followers: number;
  following: number;
  posts: number;
  comments: number;
  longestStreak: number;
  /** Whether the reader already follows them. */
  followed: boolean;
};

export type ProfileComment = {
  id: string;
  postId: string;
  body: string;
  createdAt: string;
  postTitle: string;
  postBody: string;
  postAuthor: string;
};

export type SearchHits = {
  people: ExchangePerson[];
  posts: {
    id: string;
    title: string;
    body: string;
    fullName: string;
    initials: string;
    avatarUrl: string | null;
    createdAt: string;
  }[];
};

type ProfileCardRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  initials: string | null;
  avatar_url: string | null;
  role: string | null;
  location: string | null;
  bio: string | null;
  joined_at: string;
  mine: boolean | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  comments: number | null;
  followed: boolean | null;
  longest_streak: number | null;
};

type ProfileCommentRow = {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
  post_title: string | null;
  post_body: string | null;
  post_author: string | null;
};

type FollowRow = {
  id: string;
  full_name: string | null;
  initials: string | null;
  avatar_url: string | null;
  role: string | null;
};

function personFromRow(row: FollowRow): ExchangePerson {
  return {
    id: row.id,
    name: row.full_name ?? "",
    initials: row.initials ?? "",
    avatarUrl: row.avatar_url ?? null,
    role: row.role ?? null,
  };
}

export async function fetchProfileCard(id: string): Promise<ProfileCard | null> {
  const { data, error } = await supabase
    .from("profile_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  fail(error);
  const row = data as ProfileCardRow | null;
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    username: row.username ?? null,
    initials: row.initials ?? "",
    avatarUrl: row.avatar_url ?? null,
    role: row.role ?? null,
    location: row.location ?? null,
    bio: row.bio ?? null,
    joinedAt: row.joined_at,
    mine: row.mine ?? false,
    followers: row.followers ?? 0,
    following: row.following ?? 0,
    posts: row.posts ?? 0,
    comments: row.comments ?? 0,
    followed: row.followed ?? false,
    longestStreak: row.longest_streak ?? 0,
  };
}

/** Following is one row written in your own name; the table refuses a row to yourself. */
export async function followPerson(id: string): Promise<void> {
  const me = await signedInUserId();
  const { error } = await supabase.from("follows").insert({ follower_id: me, following_id: id });
  fail(error);
}

export async function unfollowPerson(id: string): Promise<void> {
  const me = await signedInUserId();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", me)
    .eq("following_id", id);
  fail(error);
}

export async function fetchFollowList(
  personId: string,
  kind: "followers" | "following",
): Promise<ExchangePerson[]> {
  const { data, error } = await supabase.rpc("follow_list", { p_person: personId, p_kind: kind });
  fail(error);
  return (data as FollowRow[] | null ?? []).map(personFromRow);
}

/** One person's entries, newest first: the Posts tab of a profile. */
export async function fetchPersonPosts(id: string, limit = 40): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select(FEED_COLUMNS)
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);
  fail(error);
  return (data as FeedRow[] | null ?? []).map(postFromRow);
}

export type ScheduledPost = {
  id: string;
  title: string;
  body: string;
  scheduledAt: string;
};

export async function fetchScheduledPosts(): Promise<ScheduledPost[]> {
  const userId = await signedInUserId();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, body, scheduled_at")
    .eq("user_id", userId)
    .gt("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(50);
  fail(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title ?? "",
    body: row.body ?? "",
    scheduledAt: row.scheduled_at,
  }));
}

export async function fetchPersonComments(id: string, limit = 40): Promise<ProfileComment[]> {
  const { data, error } = await supabase
    .from("profile_comments")
    .select("id, post_id, body, created_at, post_title, post_body, post_author")
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);
  fail(error);
  return (data as ProfileCommentRow[] | null ?? []).map((row) => ({
    id: row.id,
    postId: row.post_id,
    body: row.body,
    createdAt: row.created_at,
    postTitle: row.post_title ?? "",
    postBody: row.post_body ?? "",
    postAuthor: row.post_author ?? "",
  }));
}

/** People and entries in one answer, so the search sheet makes one round trip. */
export async function searchExchange(query = ""): Promise<SearchHits> {
  const { data, error } = await supabase.rpc("search_exchange", { p_query: query });
  fail(error);
  const payload = (data ?? {}) as {
    people?: {
      id: string;
      full_name: string | null;
      initials: string | null;
      avatar_url: string | null;
      role: string | null;
    }[] | null;
    posts?: {
      id: string;
      title: string | null;
      body: string | null;
      full_name: string | null;
      initials: string | null;
      avatar_url: string | null;
      created_at: string;
    }[] | null;
  };
  return {
    people: (payload.people ?? []).map((row) => ({
      id: row.id,
      name: row.full_name ?? "",
      initials: row.initials ?? "",
      avatarUrl: row.avatar_url ?? null,
      role: row.role ?? null,
    })),
    posts: (payload.posts ?? []).map((row) => ({
      id: row.id,
      title: row.title ?? "",
      body: row.body ?? "",
      fullName: row.full_name ?? "",
      initials: row.initials ?? "",
      avatarUrl: row.avatar_url ?? null,
      createdAt: row.created_at,
    })),
  };
}

export const COMMUNITY_TOPICS = [
  "Technology",
  "Business",
  "Education & Career",
  "Wellness",
  "Arts & Design",
  "Food & Drink",
  "Sports",
  "Travel",
  "Lifestyle",
  "Other",
] as const;

export type CommunityTopic = string;

export const COMMUNITY_SUBCATEGORIES = {
  Technology: [
    "AI & Machine Learning",
    "Software Development",
    "Data & Analytics",
    "Product & Design",
    "Hardware & Robotics",
    "General",
  ],
  Business: [
    "Entrepreneurship",
    "Finance & Investing",
    "Marketing",
    "Small Business",
    "Careers",
    "General",
  ],
  "Education & Career": [
    "Study Groups",
    "Scholarships",
    "Job Search",
    "Skills & Training",
    "Mentorship",
    "General",
  ],
  Wellness: [
    "Fitness",
    "Mental Health",
    "Nutrition",
    "Mindfulness",
    "Healthy Habits",
    "General",
  ],
  "Arts & Design": [
    "Visual Arts",
    "Photography",
    "Writing",
    "Music",
    "Crafts",
    "General",
  ],
  "Food & Drink": [
    "Cooking",
    "Baking",
    "Restaurants",
    "Coffee & Tea",
    "Food Culture",
    "General",
  ],
  Sports: ["Football", "Basketball", "Running", "Cycling", "Fitness", "General"],
  Travel: ["Destinations", "Solo Travel", "Backpacking", "Travel Tips", "Local Guides", "General"],
  Lifestyle: ["Fashion", "Home & Living", "Parenting", "Gaming", "Personal Growth", "General"],
  Other: ["Events", "Local Communities", "Questions", "Recommendations", "General"],
} as const satisfies Record<(typeof COMMUNITY_TOPICS)[number], readonly string[]>;
const DEFAULT_SUBCATEGORIES: Readonly<Record<string, readonly string[]>> =
  COMMUNITY_SUBCATEGORIES;

export type CommunitySubcategory = string;

export type CommunityTaxonomy = {
  topics: CommunityTopic[];
  subcategories: Record<CommunityTopic, CommunitySubcategory[]>;
};

export function defaultCommunityTaxonomy(): CommunityTaxonomy {
  return {
    topics: [...COMMUNITY_TOPICS],
    subcategories: Object.fromEntries(
      COMMUNITY_TOPICS.map((topic) => [topic, [...COMMUNITY_SUBCATEGORIES[topic]]]),
    ),
  };
}

export function communityTopicSlug(topic: CommunityTopic): string {
  return topic.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function communityTopicFromSlug(
  slug: string,
  topics: readonly CommunityTopic[] = COMMUNITY_TOPICS,
): CommunityTopic | null {
  return topics.find((topic) => communityTopicSlug(topic) === slug) ?? null;
}

export function communitySubcategorySlug(subcategory: string): string {
  return subcategory.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function communitySubcategoryFromSlug(
  topic: CommunityTopic,
  slug: string,
  subcategories: readonly CommunitySubcategory[] = DEFAULT_SUBCATEGORIES[topic] ?? [],
): CommunitySubcategory | null {
  return subcategories.find(
    (subcategory) => communitySubcategorySlug(subcategory) === slug,
  ) ?? null;
}

export const COMMUNITY_TYPE_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "restricted", label: "Restricted" },
  { value: "private", label: "Private" },
] as const;

export type CommunityType = (typeof COMMUNITY_TYPE_OPTIONS)[number]["value"];

export type Community = {
  id: string;
  slug: string;
  name: string;
  avatarPath: string | null;
  bannerPath: string | null;
  topic: CommunityTopic;
  subcategory: CommunitySubcategory;
  communityType: CommunityType;
  isMature: boolean;
  description: string;
  createdAt: string;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  isOwner: boolean;
};

type CommunityRow = {
  id: string;
  slug: string;
  name: string;
  avatar_path: string | null;
  banner_path: string | null;
  topic: CommunityTopic;
  subcategory: CommunitySubcategory;
  community_type: CommunityType;
  is_mature: boolean;
  description: string;
  created_at: string;
  member_count: number;
  post_count: number;
  is_member: boolean;
  is_owner: boolean;
};

function communityFromRow(row: CommunityRow): Community {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    avatarPath: row.avatar_path,
    bannerPath: row.banner_path,
    topic: row.topic,
    subcategory: row.subcategory,
    communityType: row.community_type,
    isMature: row.is_mature,
    description: row.description,
    createdAt: row.created_at,
    memberCount: row.member_count,
    postCount: row.post_count,
    isMember: row.is_member,
    isOwner: row.is_owner,
  };
}

const COMMUNITY_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function communityMediaUrl(path: string | null | undefined): string | null {
  return path
    ? supabase.storage.from(COMMUNITY_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
    : null;
}

export async function uploadCommunityImage(userId: string, file: File): Promise<string> {
  const extension = COMMUNITY_IMAGE_TYPES[file.type];
  if (!extension) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Keep community images under 5MB.");
  const path = `${userId}/communities/${uuid()}.${extension}`;
  const { error } = await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function updateCommunityAppearance(
  communityId: string,
  patch: { avatarPath?: string | null; bannerPath?: string | null },
): Promise<void> {
  const update: { avatar_path?: string | null; banner_path?: string | null } = {};
  if (patch.avatarPath !== undefined) update.avatar_path = patch.avatarPath;
  if (patch.bannerPath !== undefined) update.banner_path = patch.bannerPath;
  if (!Object.keys(update).length) return;
  const { data, error } = await supabase
    .from("communities")
    .update(update)
    .eq("id", communityId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don’t have permission to change this community’s photos.");
}

export async function removeCommunityImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(COMMUNITY_MEDIA_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function fetchCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .from("community_directory")
    .select("*")
    .order("member_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return ((data ?? []) as CommunityRow[]).map(communityFromRow);
}

export async function fetchCommunityTaxonomy(): Promise<CommunityTaxonomy> {
  const [topicsResult, subcategoriesResult] = await Promise.all([
    supabase.from("community_topics").select("name").order("name"),
    supabase.from("community_subcategories").select("topic, name").order("name"),
  ]);
  if (topicsResult.error) throw new Error(topicsResult.error.message);
  if (subcategoriesResult.error) throw new Error(subcategoriesResult.error.message);

  const topicNames = (topicsResult.data ?? []).map((row) => row.name as string);
  const topicSet = new Set(topicNames);
  const defaultTopicSet = new Set<string>(COMMUNITY_TOPICS);
  const topics = [
    ...COMMUNITY_TOPICS.filter((topic) => topicSet.has(topic)),
    ...topicNames.filter((topic) => !defaultTopicSet.has(topic)),
  ];
  const rows = (subcategoriesResult.data ?? []) as { topic: string; name: string }[];
  const subcategories: Record<string, string[]> = {};

  for (const topic of topics) {
    const storedNames = rows.filter((row) => row.topic === topic).map((row) => row.name);
    const storedSet = new Set(storedNames);
    const defaults = DEFAULT_SUBCATEGORIES[topic] ?? [];
    const defaultSet = new Set(defaults);
    subcategories[topic] = [
      ...defaults.filter((name) => storedSet.has(name)),
      ...storedNames.filter((name) => !defaultSet.has(name)).sort((a, b) => a.localeCompare(b)),
    ];
  }

  return { topics, subcategories };
}

export async function fetchMyCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .from("community_directory")
    .select("*")
    .eq("is_member", true)
    .order("name", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  return ((data ?? []) as CommunityRow[]).map(communityFromRow);
}

export async function fetchCommunity(slug: string): Promise<Community | null> {
  const { data, error } = await supabase
    .from("community_directory")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? communityFromRow(data as CommunityRow) : null;
}

export async function fetchPublicCommunityIdea(communityId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_public_community_idea", {
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);
  return typeof data === "string" ? data : null;
}

export async function createCommunity(input: {
  name: string;
  slug: string;
  topic: CommunityTopic;
  subcategory: CommunitySubcategory;
  communityType: CommunityType;
  isMature: boolean;
  description: string;
  idea: string;
}): Promise<{ id: string; slug: string }> {
  const { data, error } = await supabase.rpc("create_community", {
    p_name: input.name,
    p_slug: input.slug,
    p_topic: input.topic,
    p_subcategory: input.subcategory,
    p_description: input.description,
    p_idea: input.idea,
    p_community_type: input.communityType,
    p_is_mature: input.isMature,
  });
  if (error) {
    if (error.code === "23505") throw new Error("That community name is already in use.");
    throw new Error(error.message);
  }
  const result = Array.isArray(data) ? data[0] : null;
  if (!result || typeof result.id !== "string" || typeof result.slug !== "string") {
    throw new Error("The community was not created. Please try again.");
  }
  return { id: result.id, slug: result.slug };
}

export async function addCommunityTopic(name: string): Promise<CommunityTopic> {
  const { data, error } = await supabase.rpc("add_community_topic", { p_name: name });
  if (error) {
    if (error.code === "23505") throw new Error("A topic with a similar link already exists.");
    throw new Error(error.message);
  }
  if (typeof data !== "string") throw new Error("Could not add that topic. Please try again.");
  return data;
}

export async function addCommunitySubcategory(
  topic: CommunityTopic,
  name: CommunitySubcategory,
): Promise<CommunitySubcategory> {
  const { data, error } = await supabase.rpc("add_community_subcategory", {
    p_topic: topic,
    p_name: name,
  });
  if (error) {
    if (error.code === "23505") {
      throw new Error("A subcategory with a similar link already exists in this topic.");
    }
    throw new Error(error.message);
  }
  if (typeof data !== "string") {
    throw new Error("Could not add that subcategory. Please try again.");
  }
  return data;
}

export async function joinCommunity(communityId: string): Promise<void> {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!data.user) throw new Error("Sign in to join a community.");
  const { error } = await supabase.from("community_members").insert({
    community_id: communityId,
    user_id: data.user.id,
    role: "member",
  });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!data.user) throw new Error("Sign in to leave a community.");
  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", data.user.id);
  if (error) throw new Error(error.message);
}

export async function fetchCommunityPosts(communityId: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("feed_posts")
    .select(FEED_COLUMNS)
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  return ((data ?? []) as FeedRow[]).map(postFromRow);
}

export async function updateCommunityDescription(
  communityId: string,
  description: string,
): Promise<void> {
  const trimmed = description.trim();
  if (trimmed.length < 15 || trimmed.length > 500) {
    throw new Error("Descriptions must be 15 to 500 characters.");
  }
  const { error } = await supabase
    .from("communities")
    .update({ description: trimmed })
    .eq("id", communityId);
  if (error) throw new Error(error.message);
}
