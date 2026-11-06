"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send, Trash2 } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { Modal } from "@/components/modal";
import { useAuth, useCurrentUser } from "@/components/auth";
import { toastError, toastSuccess } from "@/components/toast";
import { Avatar, PostBlock } from "@/components/feed-post";
import {
  addComment,
  deleteComment,
  deletePost,
  fetchComments,
  fetchMyLikes,
  fetchPost,
  likePost,
  unlikePost,
  POST_COMMENT_MAX,
  type FeedPost,
  type PostComment,
} from "@/lib/db";
import { timeAgo } from "@/lib/dates";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const me = useCurrentUser();
  const [post, setPost] = useState<FeedPost | null | undefined>(undefined);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const id = params.id;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [next, thread, likedSet] = await Promise.all([
        fetchPost(id),
        fetchComments(id).catch(() => [] as PostComment[]),
        user ? fetchMyLikes().catch(() => new Set<string>()) : Promise.resolve(new Set<string>()),
      ]);
      if (cancelled) return;
      setPost(next);
      setComments(thread);
      setLiked(likedSet.has(id));
      setLikes(next?.likes ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const isMine = Boolean(post?.mine);

  const toggleLike = useCallback(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    const turningOn = !liked;
    const apply = (on: boolean) => {
      setLiked(on);
      setLikes((n) => Math.max(0, n + (on ? 1 : -1)));
    };
    apply(turningOn);
    void (turningOn ? likePost(id) : unlikePost(id)).catch(() => {
      apply(!turningOn);
      toastError("Couldn't save that");
    });
  }, [id, liked, router, user]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const created = await addComment(id, body);
      setComments((prev) => [
        ...prev,
        {
          id: created.id,
          body,
          fullName: me.name.trim() || "Someone",
          initials: me.initials || (me.name.slice(0, 1).toUpperCase() || "?"),
          createdAt: created.createdAt,
          mine: true,
        },
      ]);
      setDraft("");
      setPost((prev) => (prev ? { ...prev, comments: prev.comments + 1 } : prev));
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't post that comment");
    } finally {
      setSending(false);
    }
  }

  async function removeComment(commentId: string) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((prev) => (prev ? { ...prev, comments: Math.max(0, prev.comments - 1) } : prev));
    } catch {
      toastError("Couldn't delete the comment");
    }
  }

  async function removePost() {
    setConfirmDelete(false);
    try {
      await deletePost(id);
      toastSuccess("Post deleted");
      router.push("/feed");
    } catch {
      toastError("Couldn't delete the post");
    }
  }

  if (post === undefined) {
    return (
      <PhoneShell tab="feed">
        <div className="card flex items-center justify-center gap-2 px-4 py-10 text-[11px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading the post…
        </div>
      </PhoneShell>
    );
  }

  if (post === null) {
    return (
      <PhoneShell tab="feed">
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">This post is gone.</p>
          <p className="tiny mt-1">It was deleted, or the link is not right.</p>
          <p className="mt-4">
            <Link href="/feed" className="cursor-pointer text-[11px] font-bold text-lime-deep hover:underline">
              Back to the feed
            </Link>
          </p>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell tab="feed">
      <div className="mb-2 flex items-center gap-2">
        <Link
          href="/feed"
          aria-label="Back to the feed"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <h1 className="text-[13px] font-bold tracking-tight text-ink">Post</h1>
      </div>

      <PostBlock
        post={post}
        liked={liked}
        likes={likes}
        signedIn={Boolean(user)}
        me={{
          initials: me.initials || (me.name.slice(0, 1).toUpperCase() || "?"),
          avatarUrl: me.avatarUrl,
        }}
        onLike={toggleLike}
        onOpen={() => document.getElementById("comment-box")?.focus()}
        onAddComment={() => document.getElementById("comment-box")?.focus()}
        previewThread={false}
      />

      <section className="mt-3.5 space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-2.5">
            <Avatar initials={comment.initials} />
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] leading-[1.55] text-ink [overflow-wrap:anywhere]">
                <span className="font-bold">{comment.fullName || "Someone"}</span> {comment.body}
              </p>
              <div className="mt-0.5 flex items-center gap-3 text-[9.5px] text-faint">
                <span>{timeAgo(comment.createdAt)}</span>
                {comment.mine ? (
                  <button
                    type="button"
                    onClick={() => void removeComment(comment.id)}
                    className="cursor-pointer font-semibold text-muted transition hover:text-ink"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {!comments.length ? (
          <p className="text-[11px] text-muted">No comments yet.</p>
        ) : null}
      </section>

      {user ? (
        <div className="mt-4 flex items-end gap-2.5">
          <Avatar
            initials={me.initials || (me.name.slice(0, 1).toUpperCase() || "?")}
            src={me.avatarUrl}
          />
          <input
            id="comment-box"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, POST_COMMENT_MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            placeholder="Add a comment…"
            aria-label="Add a comment"
            className="field-input flex-1 rounded-full px-4 py-2.5 text-[12px]"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            aria-label="Post comment"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
              draft.trim() && !sending
                ? "cursor-pointer bg-lime text-dark hover:bg-lime-deep"
                : "cursor-not-allowed bg-line text-muted"
            }`}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-[11px] text-muted">
          <Link href="/sign-in" className="cursor-pointer font-bold text-lime-deep hover:underline">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}

      {isMine ? (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-6 flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-muted transition hover:text-ink"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete this post
        </button>
      ) : null}

      {post.media.length ? (
        <p className="mt-6 text-[9.5px] leading-[1.55] text-muted">
          The photos and clips on this post are served from onWard&rsquo;s storage and stay public to
          anyone with the link until the author deletes the post, which takes the files with it.
        </p>
      ) : null}

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this post?">
        <p className="text-[11.5px] leading-[1.6] text-inksoft">
          The post, its comments and any files attached to it go away. This cannot be undone.
        </p>
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="flex-1 cursor-pointer rounded-btn border border-line bg-paper px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-cream"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={() => void removePost()}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-btn bg-ink px-4 py-3 text-[13px] font-semibold text-paper transition hover:brightness-125"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </Modal>
    </PhoneShell>
  );
}
