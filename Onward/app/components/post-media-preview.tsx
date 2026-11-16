"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Repeat2,
  Send,
  ThumbsUp,
  X,
} from "lucide-react";
import { Avatar } from "@/components/feed-post";
import { BackLink } from "@/components/ui";
import { useSmartBack } from "@/components/navigation-history";
import { useSheetDrag } from "@/components/sheet-drag";
import { PostMediaCarousel } from "@/components/post-media-carousel";
import {
  communityMediaUrl,
  initialsFor,
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const goBack = useSmartBack("/feed");
  const { gripProps, shellStyle } = useSheetDrag(detailsOpen, () => setDetailsOpen(false));
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
  const hasMoreCaption = caption.length > 140;
  const captionPreview = hasMoreCaption
    ? `${caption.slice(0, 76).trimEnd()}…`
    : caption;
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
        if (detailsOpen) setDetailsOpen(false);
        else if (!commentsOpen) goBack();
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
  }, [commentsOpen, detailsOpen, goBack, post.media.length]);

  if (!post.media.length) return null;

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
        <PostMediaCarousel
          media={post.media}
          index={index}
          onIndexChange={setIndex}
          mode="viewer"
          alt={`Photo shared by ${authorName}`}
        />

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
          <div className="mt-3">
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-white/90 [overflow-wrap:anywhere]">
              {captionPreview}
              {hasMoreCaption ? (
                <>
                  {" "}
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={detailsOpen}
                    onClick={() => setDetailsOpen(true)}
                    className="cursor-pointer text-[13px] text-white/55 transition hover:text-white"
                  >
                    more
                  </button>
                </>
              ) : null}
            </p>
          </div>
        ) : null}
      </footer>

      {detailsOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Full post details"
        >
          <button
            type="button"
            aria-label="Close post details"
            onClick={() => setDetailsOpen(false)}
            className="absolute inset-0 cursor-default bg-black/15"
          />
          <section
            className="relative flex w-full max-w-[680px] flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#17191d]/80 text-white shadow-2xl backdrop-blur-xl"
            style={shellStyle}
          >
            <div
              {...gripProps()}
              className="shrink-0 cursor-grab touch-none px-4 pb-2 pt-3 active:cursor-grabbing"
              aria-label="Drag down to close post details"
            >
              <span className="mx-auto block h-1 w-12 rounded-full bg-white/55" />
            </div>
            <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 pb-3">
              <h2 className="flex-1 text-[14px] font-semibold tracking-tight">Post details</h2>
              <button
                type="button"
                aria-label="Close post details"
                onClick={() => setDetailsOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="wheel min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
              <p className="whitespace-pre-wrap text-[14px] leading-[1.7] text-white/90">
                {caption}
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
