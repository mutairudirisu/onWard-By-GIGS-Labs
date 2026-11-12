"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  ImagePlus,
  Lightbulb,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/components/auth";
import { CommunityTopicIcon } from "@/components/community-card";
import { PhoneShell } from "@/components/phone-shell";
import { PostText } from "@/components/post-text";
import { toastError, toastSuccess } from "@/components/toast";
import { timeAgo } from "@/lib/dates";
import {
  COMMUNITY_TYPE_OPTIONS,
  communityMediaUrl,
  fetchCommunity,
  fetchCommunityPosts,
  joinCommunity,
  leaveCommunity,
  mediaUrl,
  removeCommunityImage,
  updateCommunityAppearance,
  updateCommunityDescription,
  uploadCommunityImage,
  type Community,
  type CommunityPost,
} from "@/lib/db";

const STARTER_PROMPTS = [
  "What’s one thing you wish you knew sooner?",
  "What are you working on this week?",
  "Share a resource that helped you recently.",
];

export default function CommunityHomePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [joining, setJoining] = useState(false);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [actionError, setActionError] = useState("");
  const [setupOpen, setSetupOpen] = useState(true);
  const [imageBusy, setImageBusy] = useState<"avatar" | "banner" | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const current = await fetchCommunity(slug);
      setCommunity(current);
      if (current) {
        setDescription(current.description);
        setPosts(await fetchCommunityPosts(current.id));
      } else {
        setPosts([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load this community.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  const toggleMembership = async () => {
    if (!community) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
    setJoining(true);
    setActionError("");
    const wasMember = community.isMember;
    try {
      if (wasMember && !community.isOwner) {
        await leaveCommunity(community.id);
      } else if (!wasMember) {
        await joinCommunity(community.id);
      }
      if (!community.isOwner) {
        setCommunity({
          ...community,
          isMember: !wasMember,
          memberCount: Math.max(0, community.memberCount + (wasMember ? -1 : 1)),
        });
      }
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Could not update your membership.");
    } finally {
      setJoining(false);
    }
  };

  const saveCommunityImage = async (target: "avatar" | "banner", file: File | undefined) => {
    if (!community || !user || !community.isOwner || !file || imageBusy) return;
    setImageBusy(target);
    setActionError("");
    const oldPath = target === "avatar" ? community.avatarPath : community.bannerPath;
    let uploadedPath: string | null = null;
    try {
      uploadedPath = await uploadCommunityImage(user.id, file);
      await updateCommunityAppearance(
        community.id,
        target === "avatar" ? { avatarPath: uploadedPath } : { bannerPath: uploadedPath },
      );
      setCommunity((current) =>
        current
          ? {
              ...current,
              [target === "avatar" ? "avatarPath" : "bannerPath"]: uploadedPath,
            }
          : current,
      );
      toastSuccess(target === "avatar" ? "Community photo updated." : "Community banner updated.");
      if (oldPath) {
        try {
          await removeCommunityImage(oldPath);
        } catch (reason) {
          toastError(
            reason instanceof Error
              ? `Updated the image, but couldn’t remove the old one: ${reason.message}`
              : "Updated the image, but couldn’t remove the old one.",
          );
        }
      }
    } catch (reason) {
      let cleanupMessage = "";
      if (uploadedPath) {
        try {
          await removeCommunityImage(uploadedPath);
        } catch (cleanupError) {
          cleanupMessage =
            cleanupError instanceof Error ? ` Uploaded file cleanup failed: ${cleanupError.message}` : "";
        }
      }
      setActionError(
        `${reason instanceof Error ? reason.message : "Could not update the community image."}${cleanupMessage}`,
      );
    } finally {
      setImageBusy(null);
    }
  };

  const saveDescription = async () => {
    if (!community) return;
    setSavingDescription(true);
    setActionError("");
    try {
      await updateCommunityDescription(community.id, description);
      setCommunity({ ...community, description: description.trim() });
      setEditing(false);
      toastSuccess("Community details updated.");
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Could not update community details.");
    } finally {
      setSavingDescription(false);
    }
  };

  const copyInvite = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard access is unavailable in this browser.");
      await navigator.clipboard.writeText(`${window.location.origin}/communities/${slug}`);
      toastSuccess("Community link copied.");
    } catch (reason) {
      toastError(reason instanceof Error ? reason.message : "Could not copy the community link.");
    }
  };

  if (loading) {
    return (
      <PhoneShell wide whiteBackground>
        <div className="card animate-pulse p-8 text-center text-[11px] text-muted">Loading community…</div>
      </PhoneShell>
    );
  }

  if (error || !community) {
    return (
      <PhoneShell wide whiteBackground>
        <div className="card mx-auto max-w-[540px] px-5 py-9 text-center">
          <UsersRound className="mx-auto h-7 w-7 text-lime-deep" />
          <h1 className="mt-2 text-[15px] font-bold text-ink">
            {error ? "We couldn’t open this community" : "Community not found"}
          </h1>
          {error ? <p role="alert" className="mt-1 text-[10px] text-danger">{error}</p> : null}
          <div className="mt-4 flex justify-center gap-2">
            {error ? (
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="cursor-pointer rounded-full bg-lime-deep px-4 py-2 text-[10px] font-bold text-white"
              >
                Try again
              </button>
            ) : null}
            <Link href="/communities" className="rounded-full bg-paper px-4 py-2 text-[10px] font-bold text-ink">
              Discover communities
            </Link>
          </div>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell wide whiteBackground>
      <div className="-mx-5 -mt-5 w-[calc(100%+2.5rem)] md:mx-auto md:mt-0 md:w-full md:max-w-[1080px]">
        <header className="mb-5">
          <div className="relative min-h-[190px] overflow-hidden bg-ink px-4 pb-7 pt-4 sm:px-7">
            {community.bannerPath ? (
              <>
                <img
                  src={communityMediaUrl(community.bannerPath) ?? undefined}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 bg-ink/45" />
              </>
            ) : null}
            <span className="pointer-events-none absolute -right-7 -top-16 h-48 w-48 rounded-full border-[22px] border-lime/20" />
            <span className="pointer-events-none absolute right-40 top-12 h-12 w-12 rounded-full bg-lime/15" />
            <span className="pointer-events-none absolute -bottom-16 left-[36%] h-36 w-36 rounded-full bg-lime/10" />
            <div className="relative flex items-center justify-between">
              <Link
                href="/communities"
                aria-label="Back to all communities"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/60 text-white transition hover:bg-ink/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                {community.isOwner ? (
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={imageBusy !== null}
                    aria-label="Change community banner photo"
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-white transition hover:bg-ink/80 disabled:cursor-wait disabled:opacity-70"
                  >
                    {imageBusy === "banner" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={copyInvite}
                  aria-label="Copy community link"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-white transition hover:bg-ink/80"
                >
                  <Clipboard className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 sm:px-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => community.isOwner && avatarInputRef.current?.click()}
                  disabled={!community.isOwner || imageBusy !== null}
                  aria-label={community.isOwner ? "Change community photo" : "Community photo"}
                  className="relative z-10 -mt-8 flex h-[68px] w-[68px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-white bg-lime-pale text-lime-deep disabled:cursor-default"
                >
                  {community.avatarPath ? (
                    <img
                      src={communityMediaUrl(community.avatarPath) ?? undefined}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CommunityTopicIcon topic={community.topic} className="h-8 w-8" />
                  )}
                  {community.isOwner ? (
                    <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-lime text-ink">
                      {imageBusy === "avatar" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Pencil className="h-3 w-3" />
                      )}
                    </span>
                  ) : null}
                </button>
                <div className="min-w-0 pb-1">
                  <h1 className="truncate text-[20px] font-bold tracking-tight text-ink sm:text-[24px]">
                    {community.name}
                  </h1>
                  <p className="truncate text-[10px] text-muted">onWard/{community.slug}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleMembership}
                disabled={joining || community.isOwner}
                className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[11px] font-bold transition disabled:cursor-default disabled:opacity-70 ${
                  community.isMember
                    ? "bg-cream text-ink hover:bg-lime-pale"
                    : "bg-lime-deep text-white hover:bg-ink"
                }`}
              >
                {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : community.isMember ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {community.isOwner ? "Owner" : community.isMember ? "Joined" : "Join"}
              </button>
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Community photo"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void saveCommunityImage("avatar", file);
              }}
            />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Community banner photo"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void saveCommunityImage("banner", file);
              }}
            />

            {editing && community.isOwner ? (
              <div className="mt-4">
                <label htmlFor="edit-community-description" className="sr-only">Community description</label>
                <textarea
                  id="edit-community-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-xl border border-line bg-cream px-3 py-2 text-[12px] leading-[1.5] text-ink outline-none focus:border-lime-deep"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDescription(community.description);
                      setEditing(false);
                    }}
                    className="cursor-pointer rounded-full px-3 py-1.5 text-[10px] font-semibold text-muted hover:bg-cream"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveDescription}
                    disabled={savingDescription}
                    className="cursor-pointer rounded-full bg-lime-deep px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-60"
                  >
                    {savingDescription ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="max-w-[720px] whitespace-pre-wrap text-[13px] leading-[1.6] text-inksoft">
                    {community.description}
                  </p>
                  {community.isOwner ? (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      aria-label="Edit community description"
                      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-paper hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 rounded-[20px] bg-[#f1f3f5] px-4 py-3.5">
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="font-bold text-ink">Insights</span>
                    <span className="text-muted">All time</span>
                  </div>
                  <p className="mt-2 text-[13px] text-muted">
                    {community.memberCount} {community.memberCount === 1 ? "member" : "members"} ·{" "}
                    {community.postCount} contributions
                  </p>
                </div>
              </div>
            )}
            {actionError ? <p role="alert" className="mt-3 text-[10px] text-danger">{actionError}</p> : null}
          </div>
        </header>

        <div className="space-y-5 px-5 sm:px-7">
        {community.isOwner ? (
          <section className="rounded-2xl bg-lime-pale/60 p-4 sm:p-5">
            <button
              type="button"
              aria-expanded={setupOpen}
              onClick={() => setSetupOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lime-deep">
                  <CommunityTopicIcon topic={community.topic} className="h-7 w-7" />
                </span>
                <span className="text-[15px] font-bold text-ink">Get ready for visitors</span>
              </span>
              {setupOpen ? <ChevronUp className="h-5 w-5 text-ink" /> : <ChevronDown className="h-5 w-5 text-ink" />}
            </button>
            {setupOpen ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-paper p-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lime-deep">
                    <CommunityTopicIcon topic={community.topic} className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-bold text-ink">Community logo</span>
                    <span className="mt-1 block text-[11px] leading-[1.5] text-muted">Your topic icon is ready to represent this space.</span>
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#159447] text-white">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                </div>
                <div className="rounded-xl bg-paper p-3.5 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[13px] font-bold text-ink">Make 3 posts</h2>
                      <p className="mt-1 text-[11px] leading-[1.6] text-muted">
                        A few posts help new visitors see what your community is about.
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold tabular-nums text-ink">
                      {Math.min(posts.length, 3)}/3
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-lime-deep transition-all"
                      style={{ width: `${Math.min(posts.length, 3) * 33.333}%` }}
                    />
                  </div>
                  {posts.length < 3 ? (
                    <>
                      <p className="mt-4 text-[10.5px] italic text-muted">Try these ideas</p>
                      <div className="wheel mt-2 flex gap-3 overflow-x-auto pb-1">
                        {STARTER_PROMPTS.map((prompt) => (
                          <Link
                            key={prompt}
                            href={`/feed/new?community=${community.id}&prompt=${encodeURIComponent(prompt)}`}
                            className="min-w-[220px] max-w-[280px] cursor-pointer rounded-xl bg-cream p-4 text-left text-[12px] font-semibold leading-[1.5] text-ink hover:bg-lime-pale"
                          >
                            <span className="mb-2 flex items-center gap-2 text-[10px] font-bold text-muted">
                              <Lightbulb className="h-4 w-4 text-lime-deep" /> Prompt
                            </span>
                            {prompt}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-[10px] font-semibold text-lime-deep">Starter posts complete</p>
                  )}
                  <Link
                    href={`/feed/new?community=${community.id}`}
                    className="mt-3 inline-flex cursor-pointer text-[11px] font-bold text-lime-deep hover:underline"
                  >
                    Write a welcome post
                  </Link>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="min-w-0">
            <section id="community-feed" className="border-t border-line pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-lime-deep">Community feed</p>
                  <h2 className="mt-1 text-[17px] font-bold text-ink">A good place to begin</h2>
                </div>
                {community.isMember ? (
                  <Link
                    href={`/feed/new?community=${community.id}`}
                    className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-lime-deep px-4 text-[11px] font-bold text-white hover:bg-ink"
                  >
                    <Plus className="h-4 w-4" /> Create post
                  </Link>
                ) : null}
              </div>

              {posts.length ? (
                <div className="mt-3 divide-y divide-line">
                  {posts.map((post) => (
                    <article key={post.id} className="py-4">
                      <Link href={post.authorId ? `/people/${post.authorId}` : `/feed/${post.id}`} className="flex items-center gap-2.5">
                        {post.authorAvatarUrl ? (
                          <img src={post.authorAvatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-pale text-[11px] font-bold text-lime-deep">
                            {post.authorInitials || "?"}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-bold text-ink">{post.authorName}</span>
                          <span className="block text-[10px] text-muted">{timeAgo(post.createdAt)}</span>
                        </span>
                        {post.mine ? <span className="text-[10px] font-semibold text-lime-deep">You</span> : null}
                      </Link>
                      <Link href={`/feed/${post.id}`} className="mt-2 block">
                        {post.title ? <h3 className="text-[14px] font-bold text-ink">{post.title}</h3> : null}
                        {post.body ? (
                          <PostText text={post.body} className="mt-1 text-[13px] leading-[1.6] text-inksoft" />
                        ) : null}
                        {post.media[0] ? (
                          <img
                            src={mediaUrl(post.media[0].path)}
                            alt=""
                            className="mt-3 max-h-[360px] w-full rounded-xl object-cover"
                          />
                        ) : null}
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-lime-pale/60 px-4 py-7 text-center">
                  <MessageCircle className="mx-auto h-6 w-6 text-lime-deep" />
                  <p className="mt-2 text-[13px] font-semibold text-ink">Start the conversation</p>
                  <p className="mt-1 text-[11px] leading-[1.5] text-muted">
                    {community.isMember
                      ? "Use the post composer to share something with this community."
                      : "Join the community to share the first post."}
                  </p>
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-4">
            <section className="border-t border-line py-4 lg:border-0">
              <h2 className="text-[11px] font-bold text-ink">Community details</h2>
              <div className="mt-3 space-y-2 text-[9.5px] text-muted">
                <div className="flex justify-between gap-3">
                  <span>Topic</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    <CommunityTopicIcon topic={community.topic} className="h-3.5 w-3.5" />
                    {community.topic}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Community type</span>
                  <span className="font-semibold text-ink">
                    {COMMUNITY_TYPE_OPTIONS.find((option) => option.value === community.communityType)?.label ??
                      "Public"}
                    {community.isMature ? " · 18+" : ""}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Posts</span>
                  <span className="font-semibold tabular-nums text-ink">{community.postCount}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
      </div>
    </PhoneShell>
  );
}
