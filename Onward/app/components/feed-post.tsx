"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, MoreHorizontal, Repeat2, Share2, ThumbsUp } from "lucide-react";
import { mediaUrl, type FeedPost, type PostMedia, type PostPoll } from "@/lib/db";
import { CarriedPollBlock, PollBlock } from "@/components/post-poll";
import { PostText } from "@/components/post-text";
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

/** The words of an entry, with no files under them. */
function PostWords({
  entry,
  clamp = false,
}: {
  entry: { title: string; body: string };
  clamp?: boolean;
}) {
  return (
    <>
      {entry.title ? (
        <p className="text-[13px] font-bold leading-[1.35] tracking-tight text-ink [overflow-wrap:anywhere]">
          {entry.title}
        </p>
      ) : null}
      {entry.body ? (
        <PostText
          text={entry.body}
          className={`text-[12px] leading-[1.55] text-ink ${entry.title ? "mt-1" : ""} ${
            clamp ? "line-clamp-3" : ""
          }`}
        />
      ) : null}
    </>
  );
}

/** The words and files a card shows — an entry of your own, or one a reshare carries. */
function PostBody({
  entry,
  clamp = false,
}: {
  entry: { title: string; body: string; media: PostMedia[] };
  clamp?: boolean;
}) {
  return (
    <>
      <PostWords entry={entry} clamp={clamp} />
      <MediaStage media={entry.media} className={entry.title || entry.body ? "mt-2.5" : ""} />
    </>
  );
}

/**
 * One Exchange entry, start to finish: who made it, what it says, the row of things
 * someone can do with it, and the two newest replies. Used by the timeline and by the
 * page a share link opens, so an entry looks like the same object in both.
 */
export function PostBlock({
  post,
  liked,
  likes,
  reshares,
  reshared,
  signedIn,
  poll = null,
  onVote,
  onLike,
  onReshare,
  onShare,
  onOpen,
  onManage,
  previewThread = true,
}: {
  post: FeedPost;
  liked: boolean;
  likes: number;
  reshares: number;
  reshared: boolean;
  signedIn: boolean;
  /** The poll the entry carries, when it carries one. Read separately from the feed. */
  poll?: PostPoll | null;
  /** Tapping a choice. The post it belongs to comes back with it, because that is the
   *  key the page keeps its polls under. */
  onVote: (postId: string, optionId: string) => void;
  voting?: boolean;
  onLike: (id: string) => void;
  onReshare: (id: string) => void;
  /** Opens the drawer that hands the post to a person, or to anywhere outside onWard. */
  onShare: (id: string) => void;
  onOpen: (id: string) => void;
  onManage?: (post: FeedPost) => void;
  /** Off where the whole thread is already on the page underneath. */
  previewThread?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = post.body.length > 180;
  // An entry always carries the name its author shows, including to themselves.
  const name = post.fullName || "Someone";
  // What is being passed on, when this card is a reshare rather than a writing.
  const carried = post.reshare;

  /**
   * Long words are their own control: a tap opens them out, a second tap folds them
   * back. Short ones keep opening the post's own page, which is what a tap means
   * everywhere else in the card.
   */
  const words = (entry: { title: string; body: string }, entryLong: boolean) =>
    entryLong ? (
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="block w-full cursor-pointer text-left"
      >
        <PostWords entry={entry} clamp={!expanded} />
      </button>
    ) : (
      <Link href={`/feed/${post.id}`} className="block cursor-pointer">
        <PostWords entry={entry} />
      </Link>
    );

  return (
    <article className="border-b border-line pb-3.5">
      <header className="flex items-center gap-2.5 py-2.5">
        <Avatar initials={post.initials} src={post.avatarUrl} />
        <span className="min-w-0 flex-1">
          <Link
            href={post.authorId ? `/people/${post.authorId}` : `/feed/${post.id}`}
            className="block cursor-pointer truncate text-[12px] font-bold tracking-tight text-ink hover:underline"
          >
            {name}
          </Link>
          <span className="block truncate text-[9px] text-muted">
            {post.role || timeAgo(post.createdAt)}
          </span>
        </span>
        {onManage ? (
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

      {carried ? (
        <>
          {post.body ? words(post, long) : null}
          {/* The entry being passed on, shown the way its author wrote it: their face,
              their name, every word and every file. */}
          <div className="rounded-2xl border border-line bg-cream px-3 pb-3 pt-2.5">
            <header className="flex items-center gap-2 pb-2">
              <Avatar initials={carried.initials} src={carried.avatarUrl} />
              <span className="min-w-0 flex-1">
                {carried.authorId ? (
                  <Link
                    href={`/people/${carried.authorId}`}
                    className="block truncate text-[11px] font-bold tracking-tight text-ink hover:underline"
                  >
                    {carried.fullName || "Someone"}
                  </Link>
                ) : (
                  <span className="block truncate text-[11px] font-bold tracking-tight text-ink">
                    {carried.fullName || "Someone"}
                  </span>
                )}
                <span className="block truncate text-[9px] text-muted">
                  {timeAgo(carried.createdAt)}
                </span>
              </span>
              <Repeat2 className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} />
            </header>
            <Link href={`/feed/${carried.id}`} className="block cursor-pointer">
              <PostBody entry={carried} />
              {carried.poll ? <CarriedPollBlock poll={carried.poll} /> : null}
            </Link>
          </div>
        </>
      ) : (
        <>
          {post.title || post.body ? words(post, long) : null}
          {post.media.length ? (
            <Link href={`/feed/${post.id}`} className="block cursor-pointer">
              <MediaStage
                media={post.media}
                className={post.title || post.body ? "mt-2.5" : ""}
              />
            </Link>
          ) : null}
        </>
      )}

      {poll && !carried ? (
        <PollBlock
          poll={poll}
          signedIn={signedIn}
          onVote={(optionId) => onVote(post.id, optionId)}
        />
      ) : null}

      <div className="flex items-center gap-4 pb-1 pt-2.5">
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Remove your upvote" : "Upvote this"}
          onClick={() => onLike(post.id)}
          className="flex cursor-pointer items-center gap-1.5 text-ink transition hover:text-lime-deep"
        >
          <ThumbsUp
            className={`h-[18px] w-[18px] ${liked ? "fill-current text-lime-deep" : ""}`}
            strokeWidth={liked ? 2.2 : 1.9}
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
        {/* A reshare of a reshare would carry an entry with nothing inside it, so the
            action is only offered on something somebody actually wrote. */}
        {!carried ? (
          <button
            type="button"
            aria-pressed={reshared}
            aria-label={reshared ? "Undo your reshare" : "Reshare to your own stream"}
            onClick={() => onReshare(post.id)}
            className={`flex cursor-pointer items-center gap-1.5 transition ${
              reshared ? "text-lime-deep" : "text-ink hover:text-lime-deep"
            }`}
          >
            <Repeat2 className="h-[18px] w-[18px]" strokeWidth={reshared ? 2.4 : 1.9} />
            {reshares > 0 ? (
              <span className="text-[11px] font-bold tabular-nums">{reshares}</span>
            ) : null}
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Share this post"
          onClick={() => onShare(post.id)}
          className="flex cursor-pointer items-center text-ink transition hover:text-lime-deep"
        >
          <Share2 className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </button>
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

      {!signedIn ? (
        <Link
          href="/sign-in"
          className="mt-2.5 inline-block cursor-pointer text-[10.5px] font-semibold text-lime-deep hover:underline"
        >
          Sign in to upvote, comment or reshare
        </Link>
      ) : null}
    </article>
  );
}
