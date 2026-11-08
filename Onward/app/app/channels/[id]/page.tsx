"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Hash, MessageCircle, PenLine, ThumbsUp, Users } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { Avatar } from "@/components/feed-post";
import { PostText } from "@/components/post-text";
import { useAuth } from "@/components/auth";
import { toastError } from "@/components/toast";
import {
  fetchChannel,
  fetchChannelPosts,
  joinChannel,
  leaveChannel,
  type ChannelCard,
  type FeedPost,
} from "@/lib/db";
import { timeAgo } from "@/lib/dates";

/**
 * One room: who opened it, how many people are in it, and everything written there. The
 * entries are the same Exchange posts as anywhere else, so tapping one opens the same
 * post page with its thread, its poll and its repost button.
 */
export default function ChannelPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id;

  const [channel, setChannel] = useState<ChannelCard | null | undefined>(undefined);
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setChannel(undefined);
    setPosts(null);
    void (async () => {
      try {
        const [found, written] = await Promise.all([
          fetchChannel(id),
          fetchChannelPosts(id).catch(() => [] as FeedPost[]),
        ]);
        if (cancelled) return;
        setChannel(found);
        setPosts(written);
      } catch {
        if (!cancelled) setChannel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(load, [load]);

  /** Joining flips the button at once; a refusal puts it back. */
  const toggleJoin = useCallback(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (!channel || busy) return;
    const turningOn = !channel.joined;
    setChannel({ ...channel, joined: turningOn, members: Math.max(0, channel.members + (turningOn ? 1 : -1)) });
    setBusy(true);
    void (turningOn ? joinChannel(id) : leaveChannel(id))
      .catch(() => {
        setChannel((prev) =>
          prev
            ? { ...prev, joined: !turningOn, members: Math.max(0, prev.members + (turningOn ? -1 : 1)) }
            : prev,
        );
        toastError("Couldn't save that");
      })
      .finally(() => setBusy(false));
  }, [busy, channel, id, router, user]);

  if (channel === undefined) {
    return (
      <PhoneShell tab="feed">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-cream" />
          <div className="h-3 w-full rounded bg-cream" />
          <div className="h-3 w-2/3 rounded bg-cream" />
          <div className="h-10 w-full rounded-xl bg-cream" />
        </div>
      </PhoneShell>
    );
  }

  if (channel === null) {
    return (
      <PhoneShell tab="feed">
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">This channel is gone.</p>
          <p className="tiny mt-1">Its owner closed it, or the link is not right.</p>
          <p className="mt-4">
            <Link
              href="/channels"
              className="cursor-pointer text-[11px] font-bold text-lime-deep hover:underline"
            >
              Back to the channels
            </Link>
          </p>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell tab="feed">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href="/channels"
          aria-label="Back to the channels"
          className="-ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-[13px] font-bold tracking-tight text-ink">
          {channel.name}
        </h1>
      </div>

      <header className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime-soft text-lime-deep">
          <Hash className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold tracking-tight text-ink">{channel.name}</p>
          <p className="mt-0.5 text-[11px] leading-[1.5] text-muted">
            {channel.about || "No note yet."}
          </p>
          <p className="mt-1 flex items-center gap-2 text-[9.5px] text-faint tabular-nums">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" strokeWidth={2} /> {channel.members}
            </span>
            <span>{channel.posts} posts</span>
            <span>opened {timeAgo(channel.createdAt)} ago</span>
          </p>
        </div>
      </header>

      <Link
        href={`/people/${channel.ownerId}`}
        className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-2xl border border-line bg-cream px-3 py-2"
      >
        <Avatar initials={channel.ownerInitials} src={channel.ownerAvatarUrl} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-semibold text-ink">
            {channel.ownerName || "Someone"}
          </span>
          <span className="block truncate text-[9.5px] text-muted">Opened this channel</span>
        </span>
      </Link>

      <div className="mt-3 flex gap-2.5">
        <button
          type="button"
          onClick={toggleJoin}
          disabled={busy}
          aria-pressed={channel.joined}
          className={`flex flex-1 cursor-pointer items-center justify-center rounded-btn px-4 py-2.5 text-[12.5px] font-bold transition ${
            channel.joined
              ? "border border-line bg-paper text-ink hover:bg-cream"
              : "bg-lime text-dark hover:bg-lime-deep"
          }`}
        >
          {channel.joined ? "Joined" : "Join"}
        </button>
        <Link
          href={`/feed/new?channel=${channel.id}`}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-btn border border-line bg-paper px-4 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-cream"
        >
          <PenLine className="h-4 w-4" /> Write here
        </Link>
      </div>

      <section className="mt-4" aria-label="Posts in this channel">
        {posts === null ? (
          <p className="py-6 text-[11.5px] text-muted">Loading…</p>
        ) : posts.length ? (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/feed/${post.id}`}
              className="flex cursor-pointer items-start gap-2.5 border-b border-line py-3"
            >
              <Avatar initials={post.initials} src={post.avatarUrl} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="truncate text-[11.5px] font-bold text-ink">
                    {post.fullName || "Someone"}
                  </span>
                  <span className="shrink-0 text-[9px] text-faint">{timeAgo(post.createdAt)}</span>
                </span>
                {post.title ? (
                  <span className="mt-0.5 block text-[12px] font-bold leading-[1.35] tracking-tight text-ink [overflow-wrap:anywhere]">
                    {post.title}
                  </span>
                ) : null}
                {post.body ? (
                  <PostText text={post.body} className="line-clamp-2 text-[11.5px] leading-[1.5] text-ink" />
                ) : null}
                <span className="mt-1 flex items-center gap-3 text-[9.5px] text-faint tabular-nums">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" strokeWidth={2} /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" strokeWidth={2} /> {post.comments}
                  </span>
                  {post.media.length ? <span>{post.media.length} files</span> : null}
                </span>
              </span>
            </Link>
          ))
        ) : (
          <p className="py-6 text-[11.5px] text-muted">
            Nothing written here yet. {channel.joined ? "Start it." : "Join and start it."}
          </p>
        )}
      </section>

      <p className="mt-5 rounded-xl border border-dash px-3.5 py-3 text-[9.5px] leading-[1.55] text-muted">
        Posts written in a channel are public Exchange posts, readable by anyone whether or not they
        have joined. Leaving a channel takes it off your list; it does not take your posts down.
      </p>
    </PhoneShell>
  );
}
