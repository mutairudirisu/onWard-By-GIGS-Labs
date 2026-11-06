"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { mediaUrl, type FeedPost, type PostMedia } from "@/lib/db";
import { timeAgo } from "@/lib/dates";

/** Initials tile, or the person's own picture when they have one. */
export function Avatar({
  initials,
  src,
  size = "sm",
  ring = false,
}: {
  initials: string;
  src?: string | null;
  size?: "sm" | "lg";
  ring?: boolean;
}) {
  const tile = (
    <span
      className={`flex ${
        size === "lg" ? "h-[46px] w-[46px] text-[12px]" : "h-8 w-8 text-[10px]"
      } shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime-soft font-bold text-ink`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials || "?"}
    </span>
  );
  if (!ring) return tile;
  return (
    <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-lime p-[3px]">
      {tile}
    </span>
  );
}

/** The photos and clips of one post, swiped in place the way a social app does it. */
function MediaStage({ media, className = "" }: { media: PostMedia[]; className?: string }) {
  const [index, setIndex] = useState(0);
  if (!media.length) return null;
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-ink ${className}`}>
      <div
        className="wheel flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {media.map((item) => (
          <div key={item.id} className="aspect-[4/5] w-full shrink-0 snap-center">
            {item.kind === "video" ? (
              <video
                src={mediaUrl(item.path)}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full bg-ink object-contain"
              />
            ) : (
              <img
                src={mediaUrl(item.path)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ))}
      </div>
      {media.length > 1 ? (
        <>
          <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-ink/55 px-2 py-0.5 text-[10px] font-bold tabular-nums text-paper">
            {Math.min(index + 1, media.length)}/{media.length}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {media.map((item, i) => (
              <span
                key={item.id}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-paper" : "bg-paper/40"}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * One post, start to finish: who made it, what it shows, the row of things a
 * stranger can do to it, and the two newest replies. Used by the timeline and by
 * the page a share link opens, so a post looks like the same object in both.
 */
export function PostBlock({
  post,
  liked,
  likes,
  signedIn,
  me,
  onLike,
  onOpen,
  onAddComment,
  onManage,
  previewThread = true,
}: {
  post: FeedPost;
  liked: boolean;
  likes: number;
  signedIn: boolean;
  /** Whose face goes in the comment field at the bottom of the card. */
  me: { initials: string; avatarUrl: string | null };
  onLike: (id: string) => void;
  onOpen: (id: string) => void;
  /** The same thread, opened with the keypad already up. */
  onAddComment?: (id: string) => void;
  onManage?: (post: FeedPost) => void;
  /** Off where the whole thread is already on the page underneath. */
  previewThread?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = post.body.length > 180;
  // A post always carries the name its author shows, including to themselves.
  const name = post.fullName || "Someone";
  const permalink = `${window.location.origin}/feed/${post.id}`;

  return (
    <article className="border-b border-line pb-3.5">
      <header className="flex items-center gap-2.5 py-2.5">
        <Avatar initials={post.initials} src={post.avatarUrl} />
        <span className="min-w-0 flex-1">
          <Link
            href={`/feed/${post.id}`}
            className="block cursor-pointer truncate text-[12px] font-bold tracking-tight text-ink hover:underline"
          >
            {name}
          </Link>
          <span className="block truncate text-[9px] text-muted">
            {post.role || timeAgo(post.createdAt)}
          </span>
        </span>
        {post.mine && onManage ? (
          <button
            type="button"
            aria-label="Post options"
            onClick={() => onManage(post)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>
        ) : null}
      </header>

      {post.body ? (
        <p
          className={`text-[12px] leading-[1.55] text-ink [overflow-wrap:anywhere] ${
            long && !expanded ? "line-clamp-3" : ""
          }`}
        >
          {post.body}
        </p>
      ) : null}
      {long && !expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-0.5 cursor-pointer text-[11px] font-semibold text-muted hover:text-ink"
        >
          more
        </button>
      ) : null}

      <MediaStage media={post.media} className={post.body ? "mt-2.5" : ""} />

      <div className="flex items-center gap-4 pb-1 pt-2.5">
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Remove your like" : "Like this"}
          onClick={() => onLike(post.id)}
          className="flex cursor-pointer items-center gap-1.5 text-ink transition hover:text-lime-deep"
        >
          <Heart
            className={`h-[19px] w-[19px] ${liked ? "fill-current text-red-500" : ""}`}
            strokeWidth={liked ? 2.4 : 1.9}
          />
          {likes > 0 ? <span className="text-[11px] font-bold tabular-nums">{likes}</span> : null}
        </button>
        <button
          type="button"
          aria-label="Comment"
          onClick={() => onOpen(post.id)}
          className="flex cursor-pointer items-center gap-1.5 text-ink transition hover:text-lime-deep"
        >
          <MessageCircle className="h-[19px] w-[19px]" strokeWidth={1.9} />
          {post.comments > 0 ? (
            <span className="text-[11px] font-bold tabular-nums">{post.comments}</span>
          ) : null}
        </button>
        <ShareButton
          text={post.body.slice(0, 120) || `${name} posted on onWard`}
          url={permalink}
          label=""
          className="flex cursor-pointer items-center text-ink transition hover:text-lime-deep"
        />
        <span className="ml-auto text-[9.5px] tracking-[0.06em] text-faint">
          {timeAgo(post.createdAt)}
        </span>
      </div>

      {previewThread && post.comments > 0 ? (
        <div className="mt-1.5 space-y-1">
          {post.comments > post.recentComments.length ? (
            <button
              type="button"
              onClick={() => onOpen(post.id)}
              className="block cursor-pointer text-[11px] text-muted hover:text-ink"
            >
              View all {post.comments} comments
            </button>
          ) : null}
          {post.recentComments.map((comment) => (
            <p
              key={comment.id}
              className="text-[11.5px] leading-[1.5] text-ink [overflow-wrap:anywhere]"
            >
              <span className="font-bold">{comment.fullName || "Someone"}</span> {comment.body}
            </p>
          ))}
        </div>
      ) : null}

      {signedIn ? (
        <button
          type="button"
          onClick={() => (onAddComment ?? onOpen)(post.id)}
          className="mt-2.5 flex w-full cursor-pointer items-center gap-2 rounded-full border border-line bg-paper py-1.5 pl-1.5 pr-4 text-left transition hover:border-dash"
        >
          <Avatar initials={me.initials} src={me.avatarUrl} />
          <span className="text-[11.5px] text-muted">Add a comment…</span>
        </button>
      ) : (
        <Link
          href="/sign-in"
          className="mt-2.5 inline-block cursor-pointer text-[10.5px] font-semibold text-lime-deep hover:underline"
        >
          Sign in to like or comment
        </Link>
      )}
    </article>
  );
}
