"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ThumbsUp, Trash2 } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink } from "@/components/ui";
import { Modal } from "@/components/modal";
import { ExchangeShareSheet } from "@/components/exchange-share-sheet";
import { CommentsSheet } from "@/components/comments-sheet";
import { CommentComposer } from "@/components/comment-composer";
import { PostMediaPreview } from "@/components/post-media-preview";
import { useAuth, useCurrentUser } from "@/components/auth";
import { toastError, toastSuccess, toastUndoable } from "@/components/toast";
import { Avatar, PostBlock } from "@/components/feed-post";
import { ReshareSheet } from "@/components/reshare-sheet";
import { withVote } from "@/components/post-poll";
import { PostSkeleton } from "@/components/skeleton";
import {
  addComment,
  deleteComment,
  deletePost,
  fetchComments,
  fetchFollowList,
  fetchMyPostReactions,
  fetchPolls,
  fetchPost,
  followPerson,
  joinCommunity,
  likeComment,
  mediaUrl,
  reshare,
  unlikeComment,
  setPostReaction,
  unreshare,
  unfollowPerson,
  voteInPoll,
  type FeedPost,
  type PostComment,
  type PostReaction,
  type PostPoll,
} from "@/lib/db";
import { timeAgo } from "@/lib/dates";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusComments = searchParams.get("focus") === "comments";
  const { user } = useAuth();
  const me = useCurrentUser();
  const [post, setPost] = useState<FeedPost | null | undefined>(undefined);
  const [comments, setComments] = useState<PostComment[]>([]);
  // A refused read is not the same as a deleted post, and the difference matters
  // to anyone trying to work out whether their own post is gone.
  const [unreachable, setUnreachable] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [loved, setLoved] = useState(false);
  const [loves, setLoves] = useState(0);
  const [reshared, setReshared] = useState(false);
  const [reshares, setReshares] = useState(0);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [followStatusReady, setFollowStatusReady] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [communityBusy, setCommunityBusy] = useState(false);
  const [poll, setPoll] = useState<PostPoll | null>(null);
  const [draft, setDraft] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const id = params.id;

  useEffect(() => {
    if (!post || !focusComments) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("comments")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusComments, post]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [next, thread, reactions, found] = await Promise.all([
          fetchPost(id),
          fetchComments(id).catch(() => [] as PostComment[]),
          user
            ? fetchMyPostReactions().catch(() => ({} as Record<string, PostReaction>))
            : Promise.resolve({} as Record<string, PostReaction>),
          // A page with no polls in the database is still a page, so this one failure
          // is swallowed rather than shown as a post that cannot be reached.
          fetchPolls([id]).catch(() => ({}) as Record<string, PostPoll>),
        ]);
        if (cancelled) return;
        setPost(next);
        setComments(thread);
        setLiked(reactions[id] === "like");
        setLikes(next?.likes ?? 0);
        setLoved(reactions[id] === "love");
        setLoves(next?.loves ?? 0);
        setReshared(Boolean(next?.reshared));
        setReshares(next?.reshares ?? 0);
        setPoll(found[id] ?? null);
      } catch {
        if (!cancelled) setUnreachable(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  useEffect(() => {
    if (!user || !post?.authorId || post.mine) {
      setFollowingAuthor(false);
      setFollowStatusReady(!user);
      return;
    }
    let cancelled = false;
    setFollowStatusReady(false);
    void fetchFollowList(user.id, "following")
      .then((people) => {
        if (cancelled) return;
        setFollowingAuthor(people.some((person) => person.id === post.authorId));
        setFollowStatusReady(true);
      })
      .catch(() => {
        if (!cancelled) toastError("Couldn't load follow status");
      });
    return () => {
      cancelled = true;
    };
  }, [post?.authorId, post?.mine, user]);

  const toggleFollowAuthor = useCallback(
    (authorId: string, currentlyFollowing: boolean) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      if (followBusy) return;
      setFollowBusy(true);
      setFollowingAuthor(!currentlyFollowing);
      void (currentlyFollowing ? unfollowPerson(authorId) : followPerson(authorId))
        .catch(() => {
          setFollowingAuthor(currentlyFollowing);
          toastError("Couldn't save that");
        })
        .finally(() => setFollowBusy(false));
    },
    [followBusy, router, user],
  );

  const joinPostCommunity = useCallback(
    async (communityId: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      if (communityBusy || post?.communityIsMember) return;
      setCommunityBusy(true);
      setPost((current) =>
        current?.communityId === communityId ? { ...current, communityIsMember: true } : current,
      );
      try {
        await joinCommunity(communityId);
        toastSuccess("Joined community");
      } catch (error) {
        setPost((current) =>
          current?.communityId === communityId ? { ...current, communityIsMember: false } : current,
        );
        toastError(error instanceof Error ? error.message : "Couldn't join that community");
      } finally {
        setCommunityBusy(false);
      }
    },
    [communityBusy, post?.communityIsMember, router, user],
  );

  const isMine = Boolean(post?.mine);
  const closeComments = useCallback(() => setCommentsOpen(false), []);
  const updateCommentCount = useCallback((total: number) => {
    setPost((current) => (current ? { ...current, comments: total } : current));
  }, []);

  const toggleReaction = useCallback((selected: PostReaction) => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    const current: PostReaction | null = liked ? "like" : loved ? "love" : null;
    const next = current === selected ? null : selected;
    const apply = (from: PostReaction | null, to: PostReaction | null) => {
      setLiked(to === "like");
      setLoved(to === "love");
      setLikes((count) => Math.max(0, count + (to === "like" ? 1 : 0) - (from === "like" ? 1 : 0)));
      setLoves((count) => Math.max(0, count + (to === "love" ? 1 : 0) - (from === "love" ? 1 : 0)));
    };
    apply(current, next);
    void setPostReaction(id, next).catch((error) => {
      apply(next, current);
      toastError(error instanceof Error ? error.message : "Couldn't save that");
    });
  }, [id, liked, loved, router, user]);

  const toggleLike = useCallback(() => toggleReaction("like"), [toggleReaction]);

  const applyReshare = useCallback((on: boolean) => {
    setReshared(on);
    setReshares((n) => Math.max(0, n + (on ? 1 : -1)));
  }, []);

  const undoReshare = useCallback(() => {
    applyReshare(false);
    void unreshare(id).catch(() => {
      applyReshare(true);
      toastError("Couldn't undo that");
    });
  }, [applyReshare, id]);

  /** Reposting opens the thought box first; tapping one you already reposted takes it
   *  straight back. */
  const tapReshare = useCallback(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (reshared) {
      undoReshare();
      return;
    }
    setReposting(true);
  }, [reshared, router, undoReshare, user]);

  async function confirmRepost(thought: string) {
    setReposting(false);
    applyReshare(true);
    try {
      await reshare(id, thought);
      toastUndoable("Reposted", "Undo", undoReshare);
    } catch {
      applyReshare(false);
      toastError("Couldn't save that");
    }
  }

  /**
   * Voting is optimistic, because the tap should feel like it landed. The database holds
   * the two rules - one vote per person, nothing after the close - so a refusal here
   * only puts the poll back as it was read.
   */
  const votePoll = useCallback(
    (postId: string, optionId: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      if (!poll || poll.postId !== postId || poll.closed || poll.myOptionId === optionId) return;
      const previous = poll;
      setPoll(withVote(previous, optionId));
      void voteInPoll(optionId).catch(() => {
        setPoll(previous);
        toastError("Couldn't record that vote");
      });
    },
    [poll, router, user],
  );

  async function send() {
    const body = draft.trim();
    if ((!body && !commentFiles.length) || sending || post?.canComment === false) return;
    setSending(true);
    try {
      const created = await addComment(id, body, commentFiles);
      setComments((prev) => [
        ...prev,
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
      setCommentFiles([]);
      setPost((prev) => (prev ? { ...prev, comments: prev.comments + 1 } : prev));
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't post that comment");
    } finally {
      setSending(false);
    }
  }

  /** The same contract the comment sheet uses: the row flips at once, and a
   *  refused like flips back. */
  function toggleCommentLike(comment: PostComment) {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    const turningOn = !comment.liked;
    setComments((prev) =>
      prev.map((row) =>
        row.id === comment.id
          ? { ...row, liked: turningOn, likes: Math.max(0, row.likes + (turningOn ? 1 : -1)) }
          : row,
      ),
    );
    void (turningOn ? likeComment(comment.id) : unlikeComment(comment.id)).catch(() => {
      setComments((prev) =>
        prev.map((row) =>
          row.id === comment.id
            ? { ...row, liked: !turningOn, likes: Math.max(0, row.likes + (turningOn ? -1 : 1)) }
            : row,
        ),
      );
      toastError("Couldn't save that");
    });
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

  if (unreachable && post === undefined) {
    return (
      <PhoneShell tab="feed">
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">The Exchange is out of reach right now.</p>
          <p className="tiny mt-1">Check your connection and try again.</p>
          <p className="mt-4">
            <BackLink href="/feed" label="Back to the Exchange" className="cursor-pointer text-[11px] font-bold text-lime-deep hover:underline">
              Back to the Exchange
            </BackLink>
          </p>
        </div>
      </PhoneShell>
    );
  }

  if (post === undefined) {
    return (
      <PhoneShell tab="feed">
        <PostSkeleton replies={4} />
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
            <BackLink href="/feed" label="Back to the Exchange" className="cursor-pointer text-[11px] font-bold text-lime-deep hover:underline">
              Back to the Exchange
            </BackLink>
          </p>
        </div>
      </PhoneShell>
    );
  }

  if (searchParams.get("view") === "media" && post.media.length > 0) {
    const requestedIndex = Number(searchParams.get("image"));
    const initialIndex =
      Number.isInteger(requestedIndex) && requestedIndex >= 0
        ? Math.min(requestedIndex, post.media.length - 1)
        : 0;

    return (
      <PhoneShell tab="feed">
        <PostMediaPreview
          post={post}
          initialIndex={initialIndex}
          liked={liked}
          likes={likes}
          reshared={reshared}
          reshares={reshares}
          commentsOpen={commentsOpen}
          onLike={toggleLike}
          onComment={() => setCommentsOpen(true)}
          onReshare={tapReshare}
          onShare={() => {
            if (!user) {
              router.push("/sign-in");
              return;
            }
            setSharing(true);
          }}
        />
        <CommentsSheet
          postId={id}
          open={commentsOpen}
          onClose={closeComments}
          onCountChange={updateCommentCount}
        />
        <ExchangeShareSheet
          target={{ id: post.id, title: post.title, body: post.body, fullName: post.fullName }}
          open={sharing}
          onClose={() => setSharing(false)}
        />
        <ReshareSheet
          target={{ id: post.id, title: post.title, body: post.body, fullName: post.fullName }}
          open={reposting}
          onClose={() => setReposting(false)}
          onConfirm={(thought) => void confirmRepost(thought)}
        />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell tab="feed">
      <div className="mx-auto w-full max-w-[680px]">
      <div className="mb-3.5 flex items-center gap-2 lg:mb-5">
        <BackLink
          href="/feed"
          label="Back to the Exchange"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
        </BackLink>
        <h1 className="text-[13px] font-bold tracking-tight text-ink">Post</h1>
      </div>

      <div>
        <div className="min-w-0">
          <PostBlock
            post={post}
            liked={liked}
            likes={likes}
            reshared={reshared}
            reshares={reshares}
            signedIn={Boolean(user)}
            followed={followingAuthor}
            followBusy={followBusy}
            onToggleFollow={followStatusReady || !user ? toggleFollowAuthor : undefined}
            communityJoined={post.communityIsMember ?? false}
            communityBusy={communityBusy}
            onJoinCommunity={joinPostCommunity}
            poll={poll}
            onVote={votePoll}
            onLike={toggleLike}
            onReshare={tapReshare}
            onShare={() => {
              if (!user) {
                router.push("/sign-in");
                return;
              }
              setSharing(true);
            }}
            onOpen={() => document.getElementById("comment-box")?.focus()}
            previewThread={false}
          />
        </div>

        <aside
          id="comments"
          className="mt-3.5 scroll-mt-4 rounded-2xl border border-line bg-paper p-4"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-[12px] font-bold text-ink">Comments</h2>
            <span className="text-[10px] font-semibold tabular-nums text-muted">
              {comments.length}
            </span>
          </div>

          <section className="mt-3.5 space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2.5">
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
                    <span className="font-bold">{comment.fullName || "Someone"}</span> {comment.body}
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
                  <div className="mt-0.5 flex items-center gap-3 text-[9.5px] text-faint">
                    <span>{timeAgo(comment.createdAt)}</span>
                    {user ? (
                      <button
                        type="button"
                        aria-pressed={comment.liked}
                        aria-label={comment.liked ? "Remove your upvote" : "Upvote this comment"}
                        onClick={() => toggleCommentLike(comment)}
                        className="-mx-1 flex cursor-pointer items-center gap-1 px-1 font-semibold text-muted transition hover:text-ink"
                      >
                        <ThumbsUp
                          className={`h-3 w-3 ${comment.liked ? "fill-current text-lime-deep" : ""}`}
                          strokeWidth={comment.liked ? 2.4 : 1.9}
                        />
                        {comment.likes > 0 ? (
                          <span className="tabular-nums">{comment.likes}</span>
                        ) : null}
                      </button>
                    ) : null}
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

          {user && post.canComment !== false ? (
            <CommentComposer
              className="mt-4 border-t border-line pt-3"
              value={draft}
              onChange={setDraft}
              files={commentFiles}
              onFilesChange={setCommentFiles}
              onSubmit={() => void send()}
              sending={sending}
            />
          ) : user ? (
            <p className="mt-4 border-t border-line pt-3 text-[11px] text-muted">
              {post.commentAudience === "off"
                ? "Comments are turned off for this post."
                : "Only the author’s connections can comment on this post."}
            </p>
          ) : (
            <p className="mt-4 border-t border-line pt-3 text-[11px] text-muted">
              <Link
                href="/sign-in"
                className="cursor-pointer font-bold text-lime-deep hover:underline"
              >
                Sign in
              </Link>{" "}
              to comment.
            </p>
          )}
        </aside>
      </div>

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
      </div>

      <ExchangeShareSheet
        target={{ id: post.id, title: post.title, body: post.body, fullName: post.fullName }}
        open={sharing}
        onClose={() => setSharing(false)}
      />

      <ReshareSheet
        target={{ id: post.id, title: post.title, body: post.body, fullName: post.fullName }}
        open={reposting}
        onClose={() => setReposting(false)}
        onConfirm={(thought) => void confirmRepost(thought)}
      />

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
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-btn bg-lime px-4 py-3 text-[13px] font-semibold text-dark transition hover:bg-lime-deep"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </Modal>
    </PhoneShell>
  );
}
