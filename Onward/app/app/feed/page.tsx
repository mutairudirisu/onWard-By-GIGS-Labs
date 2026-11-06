"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { PageHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import { Avatar, PostBlock } from "@/components/feed-post";
import { useAuth } from "@/components/auth";
import { toastError, toastSuccess } from "@/components/toast";
import { deletePost, fetchFeed, fetchMyLikes, likePost, unlikePost, type FeedPost } from "@/lib/db";

/**
 * The key the author strip filters on. Your posts group under one tile whatever
 * the initials happen to be; everyone else is told apart by the name they show.
 */
function authorKey(post: FeedPost) {
  const name = post.mine ? "You" : post.firstName || "Someone";
  return `${post.mine ? "you" : "other"}:${name.toLowerCase()}:${post.initials}`;
}

export default function FeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [author, setAuthor] = useState<string | null>(null);
  const [pending, setPending] = useState<FeedPost | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    Promise.all([
      fetchFeed(),
      // A visitor has no likes to read, and the table would refuse the query anyway.
      user ? fetchMyLikes().catch(() => new Set<string>()) : Promise.resolve(new Set<string>()),
    ])
      .then(([next, likedSet]) => {
        if (cancelled) return;
        setPosts(next);
        setLiked(likedSet);
        setCounts(Object.fromEntries(next.map((post) => [post.id, post.likes])));
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
      const name = post.mine ? "You" : post.firstName || "Someone";
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
      <PageHeader
        title="Feed"
        subtitle="What people chose to post. A first name, initials and whatever they show."
        actions={
          <button
            type="button"
            aria-label="New post"
            onClick={() => router.push(user ? "/feed/new" : "/sign-in")}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:border-lime-deep hover:text-lime-deep"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        }
      />

      {state === "loading" ? (
        <div className="card flex items-center justify-center gap-2 px-4 py-10 text-[11px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the feed…
        </div>
      ) : state === "error" ? (
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">The feed is out of reach right now.</p>
          <p className="tiny mt-1">Check your connection and try again.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">Nothing has been posted yet.</p>
          <p className="tiny mt-1 mx-auto max-w-[34ch]">
            The feed is its own place. What you log as an onWard stays private until you write a
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
                onLike={toggleLike}
                onOpen={(id) => router.push(`/feed/${id}`)}
                onManage={setPending}
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-dash px-3.5 py-3">
            <p className="text-[9.5px] leading-[1.55] text-muted">
              A post is public the moment it is made, so anything you write here can be read by
              anyone using onWard. Your email, surname, settings and your onWards stay private, and
              deleting a post takes its photos and clips with it. Likes and comments need a sign-in.
            </p>
          </div>
        </>
      )}

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
