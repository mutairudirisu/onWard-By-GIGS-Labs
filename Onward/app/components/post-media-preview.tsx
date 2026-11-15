"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Repeat2,
  Send,
  ThumbsUp,
} from "lucide-react";
import { Avatar } from "@/components/feed-post";
import { BackLink } from "@/components/ui";
import { useSmartBack } from "@/components/navigation-history";
import {
  communityMediaUrl,
  initialsFor,
  mediaUrl,
  type FeedPost,
} from "@/lib/db";
import { timeAgo } from "@/lib/dates";

export function PostMediaPreview({
  post,
  initialIndex,
  liked,
  likes,
  reshared,
  reshares,
  commentsOpen,
  onLike,
  onComment,
  onReshare,
  onShare,
}: {
  post: FeedPost;
  initialIndex: number;
  liked: boolean;
  likes: number;
  reshared: boolean;
  reshares: number;
  commentsOpen: boolean;
  onLike: () => void;
  onComment: () => void;
  onReshare: () => void;
  onShare: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const goBack = useSmartBack("/feed");
  const media = post.media[index] ?? post.media[0];
  const isCommunityPost = Boolean(post.communityId);
  const authorName = isCommunityPost
    ? post.communityName || post.fullName || "Community"
    : post.fullName || "Someone";
  const authorHref =
    isCommunityPost && post.communitySlug
      ? `/communities/${post.communitySlug}`
      : post.authorId
        ? `/people/${post.authorId}`
        : `/feed/${post.id}`;
  const avatarSrc = isCommunityPost
    ? communityMediaUrl(post.communityAvatarPath)
    : post.avatarUrl;
  const avatarInitials = isCommunityPost ? initialsFor(authorName) : post.initials;
  const caption = [post.title, post.body].filter(Boolean).join("\n");
  const publicPost = (post.audience ?? "anyone") === "anyone";
  const canReshare = publicPost && !post.reshare;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!commentsOpen) goBack();
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable='true'], [role='dialog']")
      ) {
        return;
      }
      if (event.key === "ArrowLeft") setIndex((current) => Math.max(0, current - 1));
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(post.media.length - 1, current + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commentsOpen, goBack, post.media.length]);

  if (!media) return null;

  return (
    <main
      className="fixed inset-0 z-[60] flex flex-col bg-[#0a0b0c] text-white"
      aria-label="Post image preview"
    >
      <header
        className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#111315] px-4"
        style={{
          height: "calc(56px + env(safe-area-inset-top))",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <BackLink
          href="/feed"
          label="Back to the Exchange"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition hover:bg-white/10"
        />
        <p className="flex-1 text-[14px] font-semibold">Post</p>
        {post.media.length > 1 ? (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white/80">
            {index + 1} / {post.media.length}
          </span>
        ) : null}
      </header>

      <section className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 py-3 sm:px-8">
        {media.kind === "video" ? (
          <video
            src={mediaUrl(media.path)}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            src={mediaUrl(media.path)}
            alt={`Photo shared by ${authorName}`}
            className="h-full w-full object-contain"
          />
        )}

        {post.media.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              disabled={index === 0}
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white shadow-lg transition hover:bg-black/75 disabled:cursor-default disabled:opacity-30 sm:left-6"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              disabled={index === post.media.length - 1}
              onClick={() =>
                setIndex((current) => Math.min(post.media.length - 1, current + 1))
              }
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white shadow-lg transition hover:bg-black/75 disabled:cursor-default disabled:opacity-30 sm:right-6"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}

        <div className="absolute bottom-5 right-3 z-10 flex flex-col items-center gap-4 sm:bottom-7 sm:right-8">
          <button
            type="button"
            aria-pressed={liked}
            aria-label={liked ? "Remove your upvote" : "Upvote this post"}
            onClick={onLike}
            className="flex min-h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full bg-black/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/60"
          >
            <ThumbsUp
              className={`h-6 w-6 drop-shadow ${liked ? "fill-lime text-lime" : ""}`}
              strokeWidth={2}
            />
            {likes > 0 ? (
              <span className="text-[11px] font-semibold tabular-nums drop-shadow">
                {likes}
              </span>
            ) : null}
          </button>
          {post.canComment !== false ? (
            <button
              type="button"
              aria-label={`View ${post.comments} ${post.comments === 1 ? "comment" : "comments"}`}
              onClick={onComment}
              className="flex min-h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full bg-black/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/60"
            >
              <MessageCircle className="h-6 w-6 -scale-x-100 drop-shadow" />
              {post.comments > 0 ? (
                <span className="text-[11px] font-semibold tabular-nums drop-shadow">
                  {post.comments}
                </span>
              ) : null}
            </button>
          ) : null}
          {canReshare ? (
            <button
              type="button"
              aria-pressed={reshared}
              aria-label={reshared ? "Undo your reshare" : "Reshare this post"}
              onClick={onReshare}
              className="flex min-h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full bg-black/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/60"
            >
              <Repeat2
                className={`h-6 w-6 drop-shadow ${reshared ? "text-lime" : ""}`}
              />
              {reshares > 0 ? (
                <span className="text-[11px] font-semibold tabular-nums drop-shadow">
                  {reshares}
                </span>
              ) : null}
            </button>
          ) : null}
          {publicPost ? (
            <button
              type="button"
              aria-label="Share this post"
              onClick={onShare}
              className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/60"
            >
              <Send className="h-6 w-6 -rotate-12 drop-shadow" />
            </button>
          ) : null}
        </div>
      </section>

      <footer className="shrink-0 border-t border-white/10 bg-[#111315] px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3.5 sm:px-6 sm:pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={authorHref} aria-label={`View ${authorName}'s profile`} className="shrink-0">
            <Avatar
              initials={avatarInitials}
              src={avatarSrc}
              size="md"
              ring
            />
          </Link>
          <Link href={authorHref} className="min-w-0 flex-1 hover:underline">
            <span className="block truncate text-[15px] font-semibold text-white">
              {authorName}
            </span>
            {post.role ? (
              <span className="block truncate text-[12px] text-white/60">{post.role}</span>
            ) : null}
          </Link>
          <span className="shrink-0 text-[11px] text-white/45">{timeAgo(post.createdAt)}</span>
        </div>
        {caption ? (
          <div className="mt-3 flex items-end gap-2">
            <p
              className={`min-w-0 flex-1 whitespace-pre-wrap text-[14px] leading-relaxed text-white/90 ${
                captionExpanded ? "" : "line-clamp-2"
              }`}
            >
              {caption}
            </p>
            {caption.length > 140 ? (
              <button
                type="button"
                aria-expanded={captionExpanded}
                onClick={() => setCaptionExpanded((expanded) => !expanded)}
                className="shrink-0 cursor-pointer pb-0.5 text-[13px] text-white/55 hover:text-white"
              >
                {captionExpanded ? "less" : "more"}
              </button>
            ) : null}
          </div>
        ) : null}
      </footer>
    </main>
  );
}
