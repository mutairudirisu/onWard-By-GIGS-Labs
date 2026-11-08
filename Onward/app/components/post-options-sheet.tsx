"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Link2, Repeat2, Share2, Trash2, UserRound } from "lucide-react";
import { useSheetDrag } from "@/components/sheet-drag";
import { toastSuccess } from "@/components/toast";
import type { FeedPost } from "@/lib/db";

/**
 * Everything someone can do with an entry from its dot: pass it on, hand it to a
 * person, put it in your own stream, meet its author, or - only for your own -
 * take it down. One list, hairlines between the rows, no chrome around it.
 */
export function PostOptionsSheet({
  post,
  reshared,
  open,
  onClose,
  onShare,
  onReshare,
  onDelete,
}: {
  post: FeedPost | null;
  reshared: boolean;
  open: boolean;
  onClose: () => void;
  onShare: (id: string) => void;
  onReshare: (id: string) => void;
  onDelete: (post: FeedPost) => void;
}) {
  const { gripProps, shellStyle } = useSheetDrag(open, onClose);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !post) return null;

  const postId = post.id;
  const row =
    "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-[12.5px] font-semibold text-ink transition hover:bg-cream";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed/${postId}`);
      toastSuccess("Link copied");
    } catch {
      toastSuccess(`onward: /feed/${postId.slice(0, 8)}`);
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[75] flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Post options"
    >
      <div
        className="absolute inset-0 bg-ink/45"
        style={{ animation: "onward-fade 0.15s ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative mt-auto flex w-full max-w-[420px] flex-col overflow-hidden rounded-t-3xl bg-paper shadow-lift"
        style={shellStyle}
      >
        <div
          {...gripProps()}
          className="shrink-0 cursor-grab touch-none px-4 pb-1 pt-2.5 active:cursor-grabbing"
          aria-label="Drag to close"
        >
          <span className="mx-auto block h-1 w-10 rounded-full bg-line" />
        </div>

        <p className="shrink-0 truncate px-4 pb-2 text-[11px] font-bold tracking-tight text-ink">
          {post.fullName || "Someone"}&rsquo;s post
        </p>

        <div className="shrink-0 border-t border-line pb-4">
          <button type="button" onClick={() => void copyLink()} className={row}>
            <Link2 className="h-[17px] w-[17px] text-inksoft" strokeWidth={2} />
            Copy link
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onShare(post.id);
            }}
            className={`${row} border-t border-line`}
          >
            <Share2 className="h-[17px] w-[17px] text-inksoft" strokeWidth={2} />
            Share with someone
          </button>
          {post.reshare ? null : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onReshare(post.id);
              }}
              className={`${row} border-t border-line`}
            >
              <Repeat2 className="h-[17px] w-[17px] text-inksoft" strokeWidth={2} />
              {reshared ? "Undo your repost" : "Repost to your stream"}
            </button>
          )}
          {post.authorId ? (
            <Link
              href={`/people/${post.authorId}`}
              onClick={onClose}
              className={`${row} border-t border-line`}
            >
              <UserRound className="h-[17px] w-[17px] text-inksoft" strokeWidth={2} />
              See {post.mine ? "your" : `${post.fullName || "someone"}'s`} profile
            </Link>
          ) : null}
          {post.mine ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(post);
              }}
              className={`${row} border-t border-line text-danger`}
            >
              <Trash2 className="h-[17px] w-[17px]" strokeWidth={2} />
              Delete post
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
