"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Loader2, Plus, Trash2 } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { Modal } from "@/components/modal";
import { CommentsSheet } from "@/components/comments-sheet";
import { Avatar, PostBlock } from "@/components/feed-post";
import { useAuth, useCurrentUser } from "@/components/auth";
import { UnreadDot, useNotifications } from "@/components/notifications";
import { Wordmark } from "@/components/wordmark";
import { toastError, toastSuccess } from "@/components/toast";
import {
  deletePost,
  fetchFeed,
  fetchMyInteractions,
  fetchMyLikes,
  likePost,
  unlikePost,
  type FeedInteraction,
  type FeedPost,
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
  if (item.kind === "like") return `You liked ${target}`;
  return item.body ? `You said: ${item.body}` : `You commented on ${target}`;
}

export default function FeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const me = useCurrentUser();
  const { unread } = useNotifications();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [author, setAuthor] = useState<string | null>(null);
  const [pending, setPending] = useState<FeedPost | null>(null);
  const [thread, setThread] = useState<{ id: string; focus: boolean } | null>(null);
  const [engaged, setEngaged] = useState<FeedInteraction[]>([]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    Promise.all([
      fetchFeed(),
      // A visitor has nothing of their own to read, and those tables would refuse
      // the query anyway.
      user ? fetchMyLikes().catch(() => new Set<string>()) : Promise.resolve(new Set<string>()),
      user ? fetchMyInteractions().catch(() => [] as FeedInteraction[]) : Promise.resolve([]),
    ])
      .then(([next, likedSet, interactions]) => {
        if (cancelled) return;
        setPosts(next);
        setLiked(likedSet);
        setCounts(Object.fromEntries(next.map((post) => [post.id, post.likes])));
        setEngaged(interactions);
        setState("ready");
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
      void (turningOn ? likePost(id) : unlikePost(id)).catch(() => {
        apply(!turningOn);
        toastError("Couldn't save that");
      });
    },
    [liked, router, user],
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
          aria-label="New post"
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
              onClick={() => setThread({ id: post.id, focus: false })}
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
        <div className="card flex items-center justify-center gap-2 px-4 py-10 text-[11px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the feed…
        </div>
      ) : state === "error" ? (
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">Posts are out of reach right now.</p>
          <p className="tiny mt-1">Check your connection and try again.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">Nothing has been posted yet.</p>
          <p className="tiny mt-1 mx-auto max-w-[34ch]">
            Posts are their own place. What you log as an onWard stays private until you write a
            post about it.
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

          <div className="space-y-3.5">
            {shown.map((post) => (
              <PostBlock
                key={post.id}
                post={post}
                liked={liked.has(post.id)}
                likes={counts[post.id] ?? post.likes}
                signedIn={Boolean(user)}
                me={{
                  initials: me.initials || (me.name.slice(0, 1).toUpperCase() || "?"),
                  avatarUrl: me.avatarUrl,
                }}
                onLike={toggleLike}
                onOpen={(id) => setThread({ id, focus: false })}
                onAddComment={(id) => setThread({ id, focus: true })}
                onManage={setPending}
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-dash px-3.5 py-3">
            <p className="text-[9.5px] leading-[1.55] text-muted">
              A post is public the moment it is made, so anything you write here can be read by
              anyone using onWard. Your name is shown with your post, to everyone who can read it.
              Your email, settings and your onWards stay private, and deleting a post takes its
              photos and clips with it. Likes and comments need a sign-in.
            </p>
          </div>
        </>
      )}

      <CommentsSheet
        postId={thread?.id ?? ""}
        open={Boolean(thread)}
        focusField={thread?.focus ?? false}
        onClose={() => setThread(null)}
        onCountChange={(total) => {
          const id = thread?.id;
          if (!id) return;
          setPosts((prev) =>
            prev.map((post) => (post.id === id ? { ...post, comments: total } : post)),
          );
        }}
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
