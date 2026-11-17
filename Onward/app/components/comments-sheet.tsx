"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ThumbsUp, X } from "lucide-react";
import { useAuth, useCurrentUser } from "@/components/auth";
import { CommentComposer } from "@/components/comment-composer";
import { Avatar } from "@/components/feed-post";
import { useSheetDrag } from "@/components/sheet-drag";
import { ThreadSkeleton } from "@/components/skeleton";
import { toastError } from "@/components/toast";
import {
  addComment,
  deleteComment,
  fetchComments,
  likeComment,
  mediaUrl,
  unlikeComment,
  type PostComment,
} from "@/lib/db";
import { timeAgo } from "@/lib/dates";
import { useKeyboardInset } from "@/lib/keyboard";

/**
 * The thread of one post, in a sheet that comes up over the half of the screen the
 * list needs and can be pulled taller - or pushed back down and dismissed - by its
 * grip. While the keyboard is up the sheet rides on top of it instead of hiding
 * behind it, which is the whole reason the field is reachable on a phone.
 */
export function CommentsSheet({
  postId,
  open,
  onClose,
  onCountChange,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
  /** The thread is the truth about how many comments there are, so the card can be
   *  told the number instead of guessing at a plus one. */
  onCountChange: (total: number) => void;
}) {
  const { user } = useAuth();
  const me = useCurrentUser();

  const [comments, setComments] = useState<PostComment[] | undefined>(undefined);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const keyboard = useKeyboardInset(open);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { gripProps, shellStyle } = useSheetDrag(open, onClose);

  // Open: take the thread, and stop the page behind scrolling.
  useEffect(() => {
    if (!open) return;
    setComments(undefined);
    setDraft("");
    setFiles([]);
    fieldRef.current?.focus();

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    void fetchComments(postId)
      .then((thread) => setComments(thread))
      .catch((error: unknown) => {
        setComments([]);
        toastError(error instanceof Error ? error.message : "Couldn't load the comments");
      });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, postId]);

  // Newest at the bottom, so the sheet opens looking at the live end of the thread.
  useEffect(() => {
    if (!open || !comments?.length) return;
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [comments, open]);

  function setTotal(next: PostComment[]) {
    setComments(next);
    onCountChange(next.length);
  }

  async function send() {
    const body = draft.trim();
    if ((!body && !files.length) || sending) return;
    setSending(true);
    try {
      const created = await addComment(postId, body, files);
      setTotal([
        ...(comments ?? []),
        {
          id: created.id,
          authorId: user?.id ?? null,
          body,
          media: created.media,
          fullName: me.name.trim() || "Someone",
          initials: me.initials || (me.name.slice(0, 1).toUpperCase() || "?"),
          createdAt: created.createdAt,
          mine: true,
          likes: 0,
          liked: false,
        },
      ]);
      setDraft("");
      setFiles([]);
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't post that comment");
    } finally {
      setSending(false);
    }
  }

  async function remove(commentId: string) {
    try {
      await deleteComment(commentId);
      setTotal((comments ?? []).filter((comment) => comment.id !== commentId));
    } catch {
      toastError("Couldn't delete the comment");
    }
  }

  /** A comment upvote is cast and uncast in place; the thread holds the number, so
   *  nothing has to be re-read to show your own. */
  async function toggleLike(comment: PostComment) {
    if (!user) return;
    const next = (comments ?? []).map((row) =>
      row.id === comment.id
        ? { ...row, liked: !row.liked, likes: Math.max(0, row.likes + (row.liked ? -1 : 1)) }
        : row,
    );
    setComments(next);
    try {
      if (comment.liked) await unlikeComment(comment.id);
      else await likeComment(comment.id);
    } catch {
      setComments(comments ?? []);
      toastError("Couldn't record that");
    }
  }

  /** Replies are a name at the front of the box, not a nested thread: nothing in the
   *  schema knows which comment a reply belongs to, so the thread stays one level. */
  function replyTo(comment: PostComment) {
    // Addressed by given name, not by the whole one the row above carries.
    const name = comment.fullName.split(" ")[0] || "someone";
    setDraft((prev) => (prev.startsWith(`@${name}`) ? prev : `@${name} ${prev}`));
    fieldRef.current?.focus();
  }

  if (!open) return null;

  const total = comments?.length ?? 0;
  const canType = Boolean(user);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center md:items-center md:px-6 md:py-8"
      style={{ paddingBottom: keyboard || "env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Comments"
    >
      <div
        className="absolute inset-0 bg-ink/45"
        style={{ animation: "onward-fade 0.15s ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative mt-auto flex w-full max-w-none flex-col overflow-hidden rounded-t-3xl bg-paper shadow-lift md:mt-0 md:!h-[min(80dvh,760px)] md:!max-h-[calc(100dvh-4rem)] md:max-w-[600px] md:rounded-3xl"
        style={shellStyle}
      >
        <div
          {...gripProps()}
          className="shrink-0 cursor-grab touch-none px-4 pb-1 pt-2.5 active:cursor-grabbing md:hidden"
          aria-label="Drag to make this bigger"
        >
          <span className="mx-auto block h-1 w-10 rounded-full bg-line" />
        </div>

        <div className="flex shrink-0 items-center gap-3 px-4 pb-2.5">
          <h2 className="flex-1 text-[13px] font-bold tracking-tight text-ink">
            {total === 0 ? "Comments" : `${total} comment${total === 1 ? "" : "s"}`}
          </h2>
          <button
            type="button"
            aria-label="Close comments"
            onClick={onClose}
            className="-mr-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div ref={listRef} className="wheel min-h-0 flex-1 overflow-y-auto border-t border-line px-4">
          {comments === undefined ? (
            <ThreadSkeleton rows={5} />
          ) : !comments.length ? (
            <p className="py-10 text-center text-[11.5px] text-muted">
              No comments yet. Say the first thing.
            </p>
          ) : (
            <ul className="pb-2">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-2.5 border-b border-line py-3 last:border-0">
                  {comment.authorId ? (
                    <Link
                      href={`/people/${comment.authorId}`}
                      aria-label={`View ${comment.fullName || "commenter"}'s profile`}
                      className="shrink-0"
                    >
                      <Avatar initials={comment.initials} />
                    </Link>
                  ) : (
                    <Avatar initials={comment.initials} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] leading-[1.55] text-ink [overflow-wrap:anywhere]">
                      {comment.authorId ? (
                        <Link
                          href={`/people/${comment.authorId}`}
                          className="font-bold hover:underline"
                        >
                          {comment.fullName || "Someone"}
                        </Link>
                      ) : (
                        <span className="font-bold">{comment.fullName || "Someone"}</span>
                      )}{" "}
                      {comment.body}
                    </p>
                    {comment.media.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {comment.media.map((media) => (
                          <img
                            key={media.path}
                            src={mediaUrl(media.path)}
                            alt={
                              media.kind === "gif"
                                ? "GIF attached to comment"
                                : "Image attached to comment"
                            }
                            className="max-h-48 max-w-full rounded-xl object-contain"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-1 flex items-center gap-3 text-[9.5px] text-faint">
                      <span>{timeAgo(comment.createdAt)}</span>
                      {canType ? (
                        <button
                          type="button"
                          aria-pressed={comment.liked}
                          aria-label={
                            comment.liked ? "Remove your upvote" : "Upvote this comment"
                          }
                          onClick={() => void toggleLike(comment)}
                          className="-mx-1 flex cursor-pointer items-center gap-1 px-1 font-semibold text-muted transition hover:text-ink"
                        >
                          <ThumbsUp
                            className={`h-3 w-3 ${
                              comment.liked ? "fill-current text-lime-deep" : ""
                            }`}
                            strokeWidth={comment.liked ? 2.4 : 1.9}
                          />
                          {comment.likes > 0 ? (
                            <span className="tabular-nums">{comment.likes}</span>
                          ) : null}
                        </button>
                      ) : null}
                      {canType && !comment.mine ? (
                        <button
                          type="button"
                          onClick={() => replyTo(comment)}
                          className="cursor-pointer font-semibold text-muted transition hover:text-ink"
                        >
                          Reply
                        </button>
                      ) : null}
                      {comment.mine ? (
                        <button
                          type="button"
                          onClick={() => void remove(comment.id)}
                          className="cursor-pointer font-semibold text-muted transition hover:text-ink"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-line px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {canType ? (
            <CommentComposer
              value={draft}
              onChange={setDraft}
              files={files}
              onFilesChange={setFiles}
              onSubmit={() => void send()}
              sending={sending}
              inputRef={fieldRef}
            />
          ) : (
            <p className="text-center text-[11px] text-muted">
              <Link
                href="/sign-in"
                className="cursor-pointer font-bold text-lime-deep hover:underline"
              >
                Sign in
              </Link>{" "}
              to join the conversation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
