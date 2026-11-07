"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, Trash2 } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { FeedSkeleton } from "@/components/skeleton";
import { Modal } from "@/components/modal";
import { CommentsSheet } from "@/components/comments-sheet";
import { ExchangeShareSheet, type ShareTarget } from "@/components/exchange-share-sheet";
import { Avatar, PostBlock } from "@/components/feed-post";
import { withVote } from "@/components/post-poll";
import { ReshareSheet, type ReshareTarget } from "@/components/reshare-sheet";
import { useAuth } from "@/components/auth";
import { UnreadDot, useNotifications } from "@/components/notifications";
import { Wordmark } from "@/components/wordmark";
import { toastError, toastSuccess, toastUndoable } from "@/components/toast";
import { askAfterUpvote } from "@/lib/feedback";
import {
  deletePost,
  fetchFeed,
  fetchMyInteractions,
  fetchMyLikes,
  fetchPolls,
  fetchSharedWithMe,
  likePost,
  reshare,
  unlikePost,
  unreshare,
  voteInPoll,
  type FeedInteraction,
  type FeedPost,
  type PostPoll,
  type SharedPost,
} from "@/lib/db";
import { timeAgo } from "@/lib/dates";

/**
 * The key the author strip filters on. The name shown is always the one the author
 * chose, so a tile reads the same to everyone; your own posts still group under one
 * tile whatever the initials happen to be.
 */
function authorKey(post: FeedPost) {
  const name = post.fullName || "Someone";
  return `${post.mine ? "you" : "other"}:${name.toLowerCase()}:${post.initials}`;
}

function interactionLine(item: FeedInteraction, post: FeedPost) {
  const who = post.mine ? "your" : `${post.fullName || "someone"}'s`;
  const target = post.media.length ? `${who} photo` : `${who} post`;
  if (item.kind === "like") return `You upvoted ${target}`;
  return item.body ? `You said: ${item.body}` : `You commented on ${target}`;
}

export default function FeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { unread } = useNotifications();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reshared, setReshared] = useState<Set<string>>(new Set());
  const [reshareCounts, setReshareCounts] = useState<Record<string, number>>({});
  const [author, setAuthor] = useState<string | null>(null);
  const [pending, setPending] = useState<FeedPost | null>(null);
  const [thread, setThread] = useState<string | null>(null);
  const [sharing, setSharing] = useState<ShareTarget | null>(null);
  const [reposting, setReposting] = useState<ReshareTarget | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [engaged, setEngaged] = useState<FeedInteraction[]>([]);
  const [handed, setHanded] = useState<SharedPost[]>([]);
  const [polls, setPolls] = useState<Record<string, PostPoll>>({});

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    Promise.all([
      fetchFeed(),
      // A visitor has nothing of their own to read, and those tables would refuse
      // the query anyway.
      user ? fetchMyLikes().catch(() => new Set<string>()) : Promise.resolve(new Set<string>()),
      user ? fetchMyInteractions().catch(() => [] as FeedInteraction[]) : Promise.resolve([]),
      user ? fetchSharedWithMe().catch(() => [] as SharedPost[]) : Promise.resolve([]),
    ])
      .then(([next, likedSet, interactions, shared]) => {
        if (cancelled) return;
        setPosts(next);
        setLiked(likedSet);
        setCounts(Object.fromEntries(next.map((post) => [post.id, post.likes])));
        setReshared(new Set(next.filter((post) => post.reshared).map((post) => post.id)));
        setReshareCounts(Object.fromEntries(next.map((post) => [post.id, post.reshares])));
        setEngaged(interactions);
        setHanded(shared);
        setState("ready");
        // Polls are a second read: a post page is worth seeing even when the poll
        // table has not been created yet, so a failure here only means no polls.
        void fetchPolls(next.map((post) => post.id))
          .then((found) => {
            if (!cancelled) setPolls(found);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleLike = useCallback(
    (id: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      const turningOn = !liked.has(id);
      const apply = (on: boolean) => {
        setLiked((prev) => {
          const next = new Set(prev);
          if (on) next.add(id);
          else next.delete(id);
          return next;
        });
        setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (on ? 1 : -1)) }));
      };
      apply(turningOn);
      void (turningOn ? likePost(id) : unlikePost(id))
        // An upvote is the moment someone is enjoying the app, so it is the moment to
        // ask - but only once the tap is actually saved, not on a failure.
        .then(() => {
          if (turningOn) askAfterUpvote();
        })
        .catch(() => {
          apply(!turningOn);
          toastError("Couldn't save that");
        });
    },
    [liked, router, user],
  );

  const applyReshare = useCallback((id: string, on: boolean) => {
    setReshared((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
    setReshareCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + (on ? 1 : -1)),
    }));
  }, []);

  const undoReshare = useCallback(
    (id: string) => {
      applyReshare(id, false);
      void unreshare(id).catch(() => {
        applyReshare(id, true);
        toastError("Couldn't undo that");
      });
    },
    [applyReshare],
  );

  /** A repost you have already made comes straight back; a new one opens the thought
   *  box first, and taking it back afterwards is what the toast is for. */
  const tapReshare = useCallback(
    (id: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      if (reshared.has(id)) {
        undoReshare(id);
        return;
      }
      const post = posts.find((row) => row.id === id);
      if (!post) return;
      setReposting({ id: post.id, title: post.title, body: post.body, fullName: post.fullName });
    },
    [posts, reshared, router, undoReshare, user],
  );

  // A repost is its own post, so a failure cannot leave a half-made one behind.
  async function confirmRepost(thought: string) {
    const target = reposting;
    if (!target) return;
    setReposting(null);
    applyReshare(target.id, true);
    try {
      await reshare(target.id, thought);
      toastUndoable("Reposted", "Undo", () => undoReshare(target.id));
    } catch {
      applyReshare(target.id, false);
      toastError("Couldn't save that");
    }
  }

  /**
   * Voting is optimistic, because the tap should feel like it landed. The database holds
   * the rule - one vote per person, and nothing after the close - so a refusal only puts
   * the poll back the way it was read.
   */
  const votePoll = useCallback(
    (postId: string, optionId: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      const poll = polls[postId];
      if (!poll || poll.closed || poll.myOptionId === optionId) return;
      const previous = poll;
      setPolls((prev) => ({ ...prev, [postId]: withVote(previous, optionId) }));
      void voteInPoll(optionId).catch(() => {
        setPolls((prev) => ({ ...prev, [postId]: previous }));
        toastError("Couldn't record that vote");
      });
    },
    [polls, router, user],
  );

  const openShare = useCallback(
    (id: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      const post = posts.find((row) => row.id === id);
      if (!post) return;
      setSharing({ id: post.id, title: post.title, body: post.body, fullName: post.fullName });
    },
    [posts, router, user],
  );

  const people = useMemo(() => {
    const byAuthor = new Map<
      string,
      { key: string; name: string; initials: string; avatar: string | null }
    >();
    for (const post of posts) {
      const key = authorKey(post);
      if (byAuthor.has(key)) continue;
      const name = post.fullName || "Someone";
      byAuthor.set(key, {
        key,
        name,
        initials: post.initials || name.slice(0, 1).toUpperCase(),
        avatar: post.avatarUrl,
      });
    }
    return [...byAuthor.values()];
  }, [posts]);

  const shown = useMemo(
    () => (author ? posts.filter((post) => authorKey(post) === author) : posts),
    [author, posts],
  );

  // Only the things still on the feed: a row whose post has gone has no name to show
  // and nothing left to open.
  const recent = useMemo(() => {
    const byId = new Map(posts.map((post) => [post.id, post]));
    const out: { item: FeedInteraction; post: FeedPost }[] = [];
    for (const item of engaged) {
      const post = byId.get(item.postId);
      if (!post) continue;
      out.push({ item, post });
      if (out.length === 3) break;
    }
    return out;
  }, [engaged, posts]);

  async function removePost(post: FeedPost) {
    setPending(null);
    try {
      await deletePost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toastSuccess("Post deleted");
    } catch {
      toastError("Couldn't delete the post");
    }
  }

  return (
    <PhoneShell tab="feed">
      <div className="mb-3.5 flex items-center">
        <button
          type="button"
          aria-label="New Exchange post"
          onClick={() => router.push(user ? "/feed/new" : "/sign-in")}
          className="-ml-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-cream"
        >
          <Plus className="h-[22px] w-[22px]" strokeWidth={2.2} />
        </button>
        <Wordmark className="flex-1 text-center text-[17px]" />
        <Link
          href="/notifications"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative -mr-2 flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-cream"
        >
          <Bell className="h-[21px] w-[21px]" strokeWidth={2} />
          <UnreadDot />
        </Link>
      </div>

      {recent.length ? (
        <div
          aria-label="What you have been part of"
          className="wheel -mx-5 mb-3 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0"
        >
          {recent.map(({ item, post }) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setThread(post.id)}
              className="flex h-9 w-max shrink-0 cursor-pointer items-center gap-2 rounded-full border border-line bg-paper pl-1.5 pr-3.5 text-left transition hover:border-dash"
            >
              <Avatar initials={post.initials} src={post.avatarUrl} />
              <span className="max-w-[190px] truncate text-[10.5px] leading-none text-inksoft">
                {interactionLine(item, post)}
              </span>
              <span className="text-[9.5px] leading-none text-faint">{timeAgo(item.createdAt)}</span>
            </button>
          ))}
        </div>
      ) : null}

      {state === "loading" ? (
        <FeedSkeleton />
      ) : state === "error" ? (
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">
            The Exchange is out of reach right now.
          </p>
          <p className="tiny mt-1">Check your connection and try again.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">
            Nothing has been shared here yet.
          </p>
          <p className="tiny mt-1 mx-auto max-w-[36ch]">
            The Exchange is where people hand on what they know, say what went well and point each
            other at useful things. What you log as an onWard stays private until you write it up.
          </p>
          {user ? (
            <p className="mt-4">
              <Link
                href="/feed/new"
                className="cursor-pointer text-[11px] font-bold text-lime-deep hover:underline"
              >
                Write the first post
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {people.length > 1 ? (
            <div className="wheel -mx-5 mb-3 flex gap-3.5 overflow-x-auto px-5 md:mx-0 md:px-0">
              {people.map((person) => (
                <button
                  key={person.key}
                  type="button"
                  aria-pressed={author === person.key}
                  onClick={() => setAuthor(author === person.key ? null : person.key)}
                  className="flex w-[52px] shrink-0 cursor-pointer flex-col items-center gap-1"
                >
                  <Avatar
                    initials={person.initials}
                    src={person.avatar}
                    ring={author === person.key}
                    size={author === person.key ? "lg" : "sm"}
                  />
                  <span className="w-full truncate text-center text-[8.5px] text-muted">
                    {person.name}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {author ? (
            <div className="mb-2.5 flex items-center justify-between rounded-lg bg-lime-pale px-3 py-1.5">
              <span className="text-[10.5px] font-semibold text-ink">
                Posts from {people.find((p) => p.key === author)?.name}
              </span>
              <button
                type="button"
                onClick={() => setAuthor(null)}
                className="cursor-pointer text-[10.5px] font-bold text-lime-deep hover:underline"
              >
                Show everyone
              </button>
            </div>
          ) : null}

          {handed.length ? (
            <section aria-label="Shared with you" className="mb-3.5">
              <p className="mb-1 text-[9.5px] uppercase tracking-[0.08em] text-faint">
                Shared with you
              </p>
              <ul className="border-t border-line">
                {handed.map((row) => (
                  <li key={row.id} className="border-b border-line">
                    <Link
                      href={`/feed/${row.postId}`}
                      className="flex cursor-pointer items-center gap-2.5 py-2.5"
                    >
                      <Avatar initials={row.fromInitials} src={row.fromAvatarUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-ink">
                          {row.fromName || "Someone"} handed you this post
                        </span>
                        <span className="block truncate text-[10px] text-muted">
                          {row.post.title || row.post.body || row.post.fullName || "from the Exchange"}{" "}
                          · {timeAgo(row.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="space-y-3.5">
            {shown.map((post) => (
              <PostBlock
                key={post.id}
                post={post}
                liked={liked.has(post.id)}
                likes={counts[post.id] ?? post.likes}
                reshared={reshared.has(post.id)}
                reshares={reshareCounts[post.id] ?? post.reshares}
                signedIn={Boolean(user)}
                poll={polls[post.id] ?? null}
                onVote={votePoll}
                onLike={toggleLike}
                onReshare={tapReshare}
                onShare={openShare}
                onOpen={setThread}
                onManage={setPending}
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-dash px-3.5 py-3">
            <p
              className={`text-[9.5px] leading-[1.55] text-muted ${
                noteOpen ? "" : "line-clamp-2"
              }`}
            >
              A post is public the moment it is made, so anything you write here can be read by
              anyone using onWard. Your name is shown with your post, to everyone who can read it.
              Your email, settings and your onWards stay private, and deleting a post takes its
              photos, clips and reshares of it with it. Upvotes, comments, reshares and shares need
              a sign-in. Handing a post to someone only adds it to their list of things shared with
              them - the post was already readable here.
            </p>
            <button
              type="button"
              onClick={() => setNoteOpen((open) => !open)}
              className="mt-1 cursor-pointer text-[10px] font-bold text-lime-deep hover:underline"
            >
              {noteOpen ? "Show less" : "Show more"}
            </button>
          </div>
        </>
      )}

      <CommentsSheet
        postId={thread ?? ""}
        open={Boolean(thread)}
        onClose={() => setThread(null)}
        onCountChange={(total) => {
          const id = thread;
          if (!id) return;
          setPosts((prev) =>
            prev.map((post) => (post.id === id ? { ...post, comments: total } : post)),
          );
        }}
      />

      <ExchangeShareSheet target={sharing} open={Boolean(sharing)} onClose={() => setSharing(null)} />

      <ReshareSheet
        target={reposting}
        open={Boolean(reposting)}
        onClose={() => setReposting(null)}
        onConfirm={(thought) => void confirmRepost(thought)}
      />

      <Modal open={Boolean(pending)} onClose={() => setPending(null)} title="Delete this post?">
        <p className="text-[11.5px] leading-[1.6] text-inksoft">
          The post, its comments and any files attached to it go away. This cannot be undone.
        </p>
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={() => setPending(null)}
            className="flex-1 cursor-pointer rounded-btn border border-line bg-paper px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-cream"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={() => pending && void removePost(pending)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-btn bg-ink px-4 py-3 text-[13px] font-semibold text-paper transition hover:brightness-125"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </Modal>
    </PhoneShell>
  );
}
