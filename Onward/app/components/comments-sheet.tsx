"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Ban,
  EyeOff,
  Flag,
  MoreVertical,
  Send,
  Sparkles,
  ThumbsUp,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth, useCurrentUser } from "@/components/auth";
import { CommentComposer } from "@/components/comment-composer";
import { Avatar } from "@/components/feed-post";
import { useSheetDrag } from "@/components/sheet-drag";
import { ThreadSkeleton } from "@/components/skeleton";
import { toastError, toastSuccess } from "@/components/toast";
import {
  addComment,
  blockPerson,
  deleteComment,
  dismissComment,
  fetchComments,
  fetchFollowingIds,
  followPerson,
  likeComment,
  mediaUrl,
  reportComment,
  unfollowPerson,
  unlikeComment,
  type CommentReportReason,
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
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followBusyIds, setFollowBusyIds] = useState<Set<string>>(new Set());
  const [reportedReasons, setReportedReasons] = useState<
    Record<string, CommentReportReason[]>
  >({});
  const [activeActionComment, setActiveActionComment] = useState<PostComment | null>(null);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const keyboard = useKeyboardInset(open);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const activeActionRef = useRef<PostComment | null>(null);
  activeActionRef.current = activeActionComment;

  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { gripProps, shellStyle } = useSheetDrag(open, onClose);
  const authorIdsKey = [
    ...new Set(
      (comments ?? [])
        .map((comment) => comment.authorId)
        .filter((id): id is string => Boolean(id && id !== user?.id)),
    ),
  ].join(",");

  // Open: take the thread, and stop the page behind scrolling.
  useEffect(() => {
    if (!open) return;
    setComments(undefined);
    setDraft("");
    setFiles([]);
    setActiveActionComment(null);
    setConfirmingBlock(false);
    setReportedReasons({});
    fieldRef.current?.focus();

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (activeActionRef.current) {
          setActiveActionComment(null);
          setConfirmingBlock(false);
        } else {
          onCloseRef.current();
        }
      }
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

  useEffect(() => {
    if (!open || !user || !authorIdsKey) {
      setFollowingIds(new Set());
      return;
    }
    let cancelled = false;
    void fetchFollowingIds(authorIdsKey.split(","))
      .then((ids) => {
        if (!cancelled) setFollowingIds(ids);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toastError(error instanceof Error ? error.message : "Couldn't load follow status");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, user?.id, authorIdsKey]);

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
          avatarUrl: me.avatarUrl || null,
          role: me.role || null,
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

  async function toggleFollow(comment: PostComment) {
    const authorId = comment.authorId;
    if (!user || !authorId || comment.mine || followBusyIds.has(authorId)) return;
    const wasFollowing = followingIds.has(authorId);
    setFollowBusyIds((current) => new Set(current).add(authorId));
    setFollowingIds((current) => {
      const next = new Set(current);
      if (wasFollowing) next.delete(authorId);
      else next.add(authorId);
      return next;
    });
    try {
      if (wasFollowing) await unfollowPerson(authorId);
      else await followPerson(authorId);
    } catch (error) {
      setFollowingIds((current) => {
        const next = new Set(current);
        if (wasFollowing) next.add(authorId);
        else next.delete(authorId);
        return next;
      });
      toastError(error instanceof Error ? error.message : "Couldn't update follow status");
    } finally {
      setFollowBusyIds((current) => {
        const next = new Set(current);
        next.delete(authorId);
        return next;
      });
    }
  }

  async function sendCommentLink(comment: PostComment) {
    const url = typeof window === "undefined" ? "" : window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: comment.body, url });
        setActiveActionComment(null);
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          toastError("Couldn't share this comment");
        }
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${comment.body}\n\n${url}`);
      toastSuccess("Comment copied with its link");
      setActiveActionComment(null);
    } catch {
      toastError("Couldn't copy this comment");
    }
  }

  async function blockCommentAuthor(comment: PostComment) {
    if (!comment.authorId || actionBusy) return;
    setActionBusy(true);
    try {
      await blockPerson(comment.authorId);
      setTotal((comments ?? []).filter((row) => row.authorId !== comment.authorId));
      setActiveActionComment(null);
      setConfirmingBlock(false);
      toastSuccess("User blocked. Their comments are hidden from your view.");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't block this user");
    } finally {
      setActionBusy(false);
    }
  }

  async function hideComment(comment: PostComment) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await dismissComment(comment.id);
      setTotal((comments ?? []).filter((row) => row.id !== comment.id));
      setActiveActionComment(null);
      toastSuccess("Comment hidden from your view");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't hide this comment");
    } finally {
      setActionBusy(false);
    }
  }

  async function sendCommentReport(comment: PostComment, reason: CommentReportReason) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await reportComment(comment.id, reason);
      setReportedReasons((current) => ({
        ...current,
        [comment.id]: [...(current[comment.id] ?? []), reason],
      }));
      setActiveActionComment(null);
      toastSuccess("Thanks. Your report has been recorded.");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't report this comment");
    } finally {
      setActionBusy(false);
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
                      <Avatar initials={comment.initials} src={comment.avatarUrl} />
                    </Link>
                  ) : (
                    <Avatar initials={comment.initials} src={comment.avatarUrl} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {comment.authorId ? (
                            <Link
                              href={`/people/${comment.authorId}`}
                              className="truncate text-[11.5px] font-bold text-ink no-underline hover:no-underline"
                            >
                              {comment.fullName || "Someone"}
                            </Link>
                          ) : (
                            <span className="truncate text-[11.5px] font-bold text-ink">
                              {comment.fullName || "Someone"}
                            </span>
                          )}
                          <span className="shrink-0 text-[9px] text-faint">·</span>
                          <span className="shrink-0 text-[9px] text-faint">
                            {timeAgo(comment.createdAt)}
                          </span>
                        </div>
                        {comment.role ? (
                          <p className="mt-0.5 truncate text-[9.5px] leading-tight text-muted">
                            {comment.role}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {comment.authorId && !comment.mine ? (
                          user ? (
                            <button
                              type="button"
                              aria-pressed={followingIds.has(comment.authorId)}
                              disabled={followBusyIds.has(comment.authorId)}
                              onClick={() => void toggleFollow(comment)}
                              className="rounded-full px-2 py-1 text-[9.5px] font-bold text-lime-deep transition hover:bg-lime-soft disabled:opacity-50"
                            >
                              {followingIds.has(comment.authorId) ? "Following" : "Follow"}
                            </button>
                          ) : (
                            <Link
                              href="/sign-in"
                              className="rounded-full px-2 py-1 text-[9.5px] font-bold text-lime-deep no-underline transition hover:bg-lime-soft"
                            >
                              Follow
                            </Link>
                          )
                        ) : null}
                        <button
                          type="button"
                          aria-label={`More actions for ${comment.fullName || "comment"}`}
                          onClick={() => {
                            setActiveActionComment(comment);
                            setConfirmingBlock(false);
                          }}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-ink"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[11.5px] leading-[1.55] text-ink [overflow-wrap:anywhere]">
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
      {activeActionComment ? (
        <div
          className="absolute inset-0 z-[80] flex items-end justify-center bg-ink/35 md:items-center md:p-6"
          onClick={() => {
            setActiveActionComment(null);
            setConfirmingBlock(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="comment-actions-title"
            className="relative w-full max-w-[500px] rounded-t-3xl bg-paper px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-lift md:rounded-3xl md:pb-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3">
              <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line md:hidden" />
              <div className="flex items-center justify-between">
                <h3 id="comment-actions-title" className="text-[13px] font-bold text-ink">
                  {confirmingBlock
                    ? `Block ${activeActionComment.fullName || "this user"}?`
                    : "Comment options"}
                </h3>
                <button
                  type="button"
                  aria-label="Close comment options"
                  onClick={() => {
                    setActiveActionComment(null);
                    setConfirmingBlock(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-cream"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {confirmingBlock ? (
              <>
                <p className="mb-4 text-[11px] leading-[1.55] text-muted">
                  Their comments will no longer appear in either person&apos;s comment threads.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => setConfirmingBlock(false)}
                    className="flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-[11px] font-semibold text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void blockCommentAuthor(activeActionComment)}
                    className="flex-1 rounded-xl bg-red-600 px-3 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
                  >
                    {actionBusy ? "Blocking…" : "Block user"}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => void sendCommentLink(activeActionComment)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[11.5px] font-semibold text-ink transition hover:bg-cream"
                >
                  <Send className="h-4 w-4 text-muted" /> Send
                </button>
                {user && activeActionComment.authorId && !activeActionComment.mine ? (
                  <>
                    <button
                      type="button"
                      disabled={followBusyIds.has(activeActionComment.authorId)}
                      onClick={() => void toggleFollow(activeActionComment)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[11.5px] font-semibold text-ink transition hover:bg-cream disabled:opacity-50"
                    >
                      {followingIds.has(activeActionComment.authorId) ? (
                        <UserMinus className="h-4 w-4 text-muted" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-muted" />
                      )}
                      {followingIds.has(activeActionComment.authorId) ? "Unfollow" : "Follow"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingBlock(true)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[11.5px] font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Ban className="h-4 w-4" /> Block user
                    </button>
                  </>
                ) : null}
                {user && !activeActionComment.mine ? (
                  <>
                    <button
                      type="button"
                      disabled={
                        actionBusy ||
                        (reportedReasons[activeActionComment.id] ?? []).includes("ai_slop")
                      }
                      onClick={() => void sendCommentReport(activeActionComment, "ai_slop")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[11.5px] font-semibold text-ink transition hover:bg-cream disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4 text-muted" />
                      {(reportedReasons[activeActionComment.id] ?? []).includes("ai_slop")
                        ? "AI-slop report sent"
                        : "Seems like AI slop"}
                    </button>
                    <button
                      type="button"
                      disabled={
                        actionBusy ||
                        (reportedReasons[activeActionComment.id] ?? []).includes("other")
                      }
                      onClick={() => void sendCommentReport(activeActionComment, "other")}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[11.5px] font-semibold text-ink transition hover:bg-cream disabled:opacity-50"
                    >
                      <Flag className="h-4 w-4 text-muted" />
                      {(reportedReasons[activeActionComment.id] ?? []).includes("other")
                        ? "Report sent"
                        : "Report comment"}
                    </button>
                    <button
                      type="button"
                      disabled={actionBusy}
                      onClick={() => void hideComment(activeActionComment)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[11.5px] font-semibold text-ink transition hover:bg-cream disabled:opacity-50"
                    >
                      <EyeOff className="h-4 w-4 text-muted" /> I don&apos;t want to see this
                    </button>
                  </>
                ) : !user ? (
                  <Link
                    href="/sign-in"
                    className="block rounded-xl px-3 py-3 text-[11px] font-semibold text-lime-deep no-underline hover:bg-lime-soft"
                  >
                    Sign in to manage comments
                  </Link>
                ) : null}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
