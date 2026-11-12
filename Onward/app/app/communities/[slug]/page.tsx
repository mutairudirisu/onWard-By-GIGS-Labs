"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  Settings2,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/components/auth";
import { CommunityIcon, CommunityTopicIcon } from "@/components/community-card";
import { PhoneShell } from "@/components/phone-shell";
import { toastError, toastSuccess } from "@/components/toast";
import { timeAgo } from "@/lib/dates";
import {
  createCommunityPost,
  fetchCommunity,
  fetchCommunityPosts,
  joinCommunity,
  leaveCommunity,
  updateCommunityDescription,
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
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [actionError, setActionError] = useState("");

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

  const publish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!community) return;
    setPosting(true);
    setActionError("");
    try {
      await createCommunityPost({ communityId: community.id, title, body });
      setTitle("");
      setBody("");
      setComposerOpen(false);
      toastSuccess("Your community post is live.");
      try {
        const [nextCommunity, nextPosts] = await Promise.all([
          fetchCommunity(community.slug),
          fetchCommunityPosts(community.id),
        ]);
        if (nextCommunity) setCommunity(nextCommunity);
        setPosts(nextPosts);
      } catch (refreshReason) {
        setActionError(
          `Your post was published, but the page could not refresh: ${
            refreshReason instanceof Error ? refreshReason.message : "Please reload the page."
          }`,
        );
      }
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "Could not publish this post.");
    } finally {
      setPosting(false);
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
      <div className="mx-auto w-full max-w-[1080px]">
        <Link
          href="/communities"
          className="mb-3 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[10px] font-semibold text-muted hover:bg-paper hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> All communities
        </Link>

        <header className="mb-5 overflow-hidden rounded-2xl border border-line bg-paper">
          <div className="relative min-h-[130px] overflow-hidden bg-ink px-5 pb-7 pt-6 sm:px-7">
            <span className="pointer-events-none absolute -right-7 -top-16 h-48 w-48 rounded-full border-[22px] border-lime/20" />
            <span className="pointer-events-none absolute right-40 top-12 h-12 w-12 rounded-full bg-lime/15" />
            <div className="relative flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.13em] text-lime">
              <CommunityTopicIcon topic={community.topic} className="h-4 w-4" /> {community.topic}
            </div>
            <h1 className="relative mt-2 max-w-[75%] text-[24px] font-bold tracking-tight text-white sm:text-[30px]">
              {community.name}
            </h1>
            <p className="relative mt-1 text-[10px] text-white/65">onWard/{community.slug}</p>
            <div className="absolute bottom-0 left-5 translate-y-1/2 sm:left-7">
              <CommunityIcon large />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-11 sm:px-7">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9.5px] text-muted">
              <span><strong className="text-ink">{community.memberCount}</strong> {community.memberCount === 1 ? "member" : "members"}</span>
              <span><strong className="text-ink">{community.postCount}</strong> posts</span>
              <span className="rounded-full bg-lime-pale px-2 py-0.5 font-semibold text-lime-deep">Public</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyInvite}
                aria-label="Copy community link"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-cream text-inksoft hover:bg-lime-pale"
              >
                <Clipboard className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleMembership}
                disabled={joining || community.isOwner}
                className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[10px] font-bold transition disabled:cursor-default disabled:opacity-70 ${
                  community.isMember
                    ? "bg-cream text-ink hover:bg-lime-pale"
                    : "bg-lime-deep text-white hover:bg-ink"
                }`}
              >
                {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : community.isMember ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {community.isOwner ? "Owner" : community.isMember ? "Joined" : "Join community"}
              </button>
            </div>
          </div>
          {actionError ? <p role="alert" className="px-5 pb-3 text-[10px] text-danger sm:px-7">{actionError}</p> : null}
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="min-w-0">
            <section className="card mb-4 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-lime-deep">Community feed</p>
                  <h2 className="mt-1 text-[15px] font-bold text-ink">A good place to begin</h2>
                </div>
                {community.isMember ? (
                  <button
                    type="button"
                    onClick={() => setComposerOpen((open) => !open)}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-lime-deep px-3.5 text-[9.5px] font-bold text-white hover:bg-ink"
                  >
                    <Plus className="h-4 w-4" /> Create post
                  </button>
                ) : null}
              </div>

              {community.isMember && composerOpen ? (
                <form onSubmit={publish} className="mt-4 rounded-xl border border-line bg-cream p-3">
                  <label htmlFor="community-post-title" className="sr-only">Post title (optional)</label>
                  <input
                    id="community-post-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={120}
                    placeholder="Add a title (optional)"
                    className="mb-2 h-9 w-full rounded-lg border border-line bg-paper px-3 text-[10.5px] text-ink outline-none placeholder:text-faint focus:border-lime-deep"
                  />
                  <label htmlFor="community-post-body" className="sr-only">Your post</label>
                  <textarea
                    id="community-post-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    required
                    placeholder="Share an idea, ask a question, or tell us what you’re working on…"
                    className="w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 text-[10.5px] leading-[1.6] text-ink outline-none placeholder:text-faint focus:border-lime-deep"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[9px] text-muted">{body.length}/2000</span>
                    <button
                      type="submit"
                      disabled={posting || !body.trim()}
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-lime-deep px-3 text-[9px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {posting ? "Posting…" : "Publish"}
                    </button>
                  </div>
                </form>
              ) : null}

              {actionError && composerOpen ? <p role="alert" className="mt-2 text-[10px] text-danger">{actionError}</p> : null}

              {posts.length ? (
                <div className="mt-4 space-y-3">
                  {posts.map((post) => (
                    <article key={post.id} className="rounded-xl border border-line bg-paper p-3.5">
                      <div className="flex items-center gap-2.5">
                        {post.authorAvatarUrl ? (
                          <img
                            src={post.authorAvatarUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-pale text-[9px] font-bold text-lime-deep">
                            {post.authorInitials || "?"}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-bold text-ink">{post.authorName}</p>
                          <p className="text-[8.5px] text-muted">{timeAgo(post.createdAt)}</p>
                        </div>
                        {post.mine ? <span className="text-[8px] font-semibold text-lime-deep">You</span> : null}
                      </div>
                      {post.title ? <h3 className="mt-3 text-[12px] font-bold text-ink">{post.title}</h3> : null}
                      <p className="mt-2 whitespace-pre-wrap text-[10.5px] leading-[1.65] text-inksoft">{post.body}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-cream px-4 py-6 text-center">
                  <MessageCircle className="mx-auto h-6 w-6 text-lime-deep" />
                  <p className="mt-2 text-[11px] font-semibold text-ink">Start the conversation</p>
                  <p className="mt-1 text-[9.5px] text-muted">
                    {community.isMember ? "A thoughtful first post can make it easier for others to join in." : "Join the community to share the first post."}
                  </p>
                  {community.isMember ? (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => {
                            setBody(prompt);
                            setComposerOpen(true);
                          }}
                          className="cursor-pointer rounded-full bg-paper px-3 py-1.5 text-[8.5px] font-semibold text-inksoft hover:bg-lime-pale"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          </main>

          <aside className="space-y-4">
            <section className="card p-4">
              <h2 className="text-[11px] font-bold text-ink">About this community</h2>
              {editing && community.isOwner ? (
                <div className="mt-3">
                  <label htmlFor="edit-community-description" className="sr-only">Community description</label>
                  <textarea
                    id="edit-community-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-[10px] leading-[1.5] text-ink outline-none focus:border-lime-deep"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDescription(community.description);
                        setEditing(false);
                      }}
                      className="cursor-pointer rounded-full px-3 py-1.5 text-[9px] font-semibold text-muted hover:bg-cream"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveDescription}
                      disabled={savingDescription}
                      className="cursor-pointer rounded-full bg-lime-deep px-3 py-1.5 text-[9px] font-bold text-white disabled:opacity-60"
                    >
                      {savingDescription ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-[10px] leading-[1.65] text-inksoft">
                  {community.description}
                </p>
              )}
              {community.isOwner && !editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-[9px] font-bold text-lime-deep hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit description
                </button>
              ) : null}
            </section>

            {community.isOwner ? (
              <section className="card p-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-lime-deep" />
                  <h2 className="text-[11px] font-bold text-ink">Community setup</h2>
                </div>
                <p className="mt-2 text-[9px] leading-[1.5] text-muted">
                  Help new members understand the space and feel welcome.
                </p>
                <div className="mt-3 rounded-xl bg-lime-pale/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9.5px] font-bold text-ink">Make 3 starter posts</span>
                    <span className="text-[9px] font-semibold tabular-nums text-lime-deep">
                      {Math.min(posts.length, 3)}/3
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full bg-lime-deep transition-all"
                      style={{ width: `${Math.min(posts.length, 3) * 33.333}%` }}
                    />
                  </div>
                  {posts.length < 3 ? (
                    <button
                      type="button"
                      onClick={() => setComposerOpen(true)}
                      className="mt-3 cursor-pointer text-[9px] font-bold text-lime-deep hover:underline"
                    >
                      Write a welcome post
                    </button>
                  ) : (
                    <p className="mt-3 text-[9px] font-semibold text-lime-deep">Starter posts complete</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={copyInvite}
                  className="mt-3 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-cream text-[9.5px] font-bold text-ink hover:bg-lime-pale"
                >
                  <UsersRound className="h-3.5 w-3.5" /> Invite members
                </button>
              </section>
            ) : null}

            <section className="card p-4">
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
                  <span>Visibility</span>
                  <span className="font-semibold text-ink">Public</span>
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
    </PhoneShell>
  );
}
