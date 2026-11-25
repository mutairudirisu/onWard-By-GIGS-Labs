"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  ExternalLink,
  FileText,
  Globe2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Repeat2,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  communityMediaUrl,
  initialsFor,
  mediaUrl,
  type FeedPost,
  type PostMedia,
  type PostPoll,
} from "@/lib/db";
import { CarriedPollBlock, PollBlock } from "@/components/feed/post-poll";
import { PostMediaCarousel } from "@/components/feed/post-media-carousel";
import { PostText } from "@/components/feed/post-text";
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
  size?: "sm" | "md" | "lg" | "xl" | "compact";
  ring?: boolean;
}) {
  const tile = (
    <span
      className={`flex ${
        size === "compact"
          ? "h-10 w-10 text-[11px]"
          : size === "xl"
            ? "h-16 w-16 text-[16px] lg:h-20 lg:w-20 lg:text-[20px]"
            : size === "md"
              ? "h-14 w-14 text-[15px]"
              : size === "lg"
                ? "h-[46px] w-[46px] text-[12px]"
                : "h-8 w-8 text-[10px]"
      } shrink-0 items-center justify-center overflow-hidden rounded-full border border-lime-deep bg-lime-soft font-bold text-ink`}
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
function MediaStage({
  media,
  postId,
  className = "",
  rounded = true,
}: {
  media: PostMedia[];
  postId: string;
  className?: string;
  rounded?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  if (!media.length) return null;
  return (
    <div className={className}>
      <PostMediaCarousel
        media={media}
        index={index}
        onIndexChange={setIndex}
        mode="feed"
        alt="Post media"
        rounded={rounded}
        onOpen={(selectedIndex) =>
          router.push(`/feed/${postId}?view=media&image=${selectedIndex}`)
        }
      />
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
          className={`text-[13px] leading-[1.55] text-ink ${entry.title ? "mt-1" : ""} ${
            clamp ? "line-clamp-3" : ""
          }`}
        />
      ) : null}
    </>
  );
}

type PostDocument = { title: string; url: string; pdf: boolean };

function extractPostDocument(body: string): { body: string; document: PostDocument | null } {
  const marker = /^Document: \[([^\]\r\n]+)\]\((https:\/\/[^\s)]+)\)$/m;
  const match = marker.exec(body);
  if (!match) return { body, document: null };
  try {
    const url = new URL(match[2]!);
    const storageBase = new URL(mediaUrl(""));
    const storagePath = "/storage/v1/object/public/post-media/";
    const filePath = url.pathname.startsWith(storagePath)
      ? decodeURIComponent(url.pathname.slice(storagePath.length))
      : "";
    if (
      url.origin !== storageBase.origin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !/^[0-9a-f-]{36}\/documents\/[0-9a-f-]{36}\.[a-z0-9]+$/i.test(filePath)
    ) {
      return { body, document: null };
    }
    return {
      body: body.replace(match[0], "").trim(),
      document: {
        title: match[1]!,
        url: url.href,
        pdf: filePath.toLowerCase().endsWith(".pdf"),
      },
    };
  } catch {
    return { body, document: null };
  }
}

function DocumentStage({ document }: { document: PostDocument }) {
  const [page, setPage] = useState(1);
  const source = document.pdf ? `${document.url}#page=${page}` : null;

  return (
    <section className="mt-2.5 overflow-hidden rounded-2xl border border-line bg-cream">
      <header className="flex items-center gap-2 px-3 py-2.5">
        <FileText className="h-4 w-4 shrink-0 text-lime-deep" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-ink">
          {document.title}
        </p>
        <a
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${document.title}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-inksoft transition hover:bg-lime-pale"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </header>
      {document.pdf ? (
        <>
          <iframe
            key={source}
            src={source!}
            title={`Preview of ${document.title}`}
            loading="lazy"
            className="h-[min(60vh,460px)] min-h-[300px] w-full border-y border-line bg-white"
          />
          <footer className="flex items-center justify-between px-3 py-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="flex h-8 cursor-pointer items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-inksoft transition hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-[10px] font-medium tabular-nums text-muted">
              Page {page} · scroll or use arrows
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              className="flex h-8 cursor-pointer items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-inksoft transition hover:bg-lime-pale"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </footer>
        </>
      ) : (
        <a
          href={document.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 border-t border-line px-3 py-5 text-[11px] font-semibold text-lime-deep hover:bg-lime-pale"
        >
          Open or download document
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </section>
  );
}

/** The words and files a card shows — an entry of your own, or one a reshare carries. */
function PostBody({
  entry,
  clamp = false,
}: {
  entry: { id: string; title: string; body: string; media: PostMedia[] };
  clamp?: boolean;
}) {
  const { body, document } = extractPostDocument(entry.body);
  const words = { title: entry.title, body };
  return (
    <>
      <PostWords entry={words} clamp={clamp} />
      <MediaStage
        media={entry.media}
        postId={entry.id}
        className={entry.title || entry.body ? "mt-2.5" : ""}
      />
      {document ? <DocumentStage document={document} /> : null}
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
  followed = false,
  followBusy = false,
  onToggleFollow,
  communityJoined = post.communityIsMember ?? false,
  communityBusy = false,
  onJoinCommunity,
  previewThread = false,
  edgeToEdge = false,
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
  followed?: boolean;
  followBusy?: boolean;
  onToggleFollow?: (authorId: string, followed: boolean) => void;
  communityJoined?: boolean;
  communityBusy?: boolean;
  onJoinCommunity?: (communityId: string) => void;
  /** Off where the whole thread is already on the page underneath. */
  previewThread?: boolean;
  edgeToEdge?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const parsedPost = extractPostDocument(post.body);
  const cleanPost = { ...post, body: parsedPost.body };
  const long = parsedPost.body.length > 180;
  const communityPost = Boolean(post.communityId);
  const name = communityPost ? post.communityName || "Community" : post.fullName || "Someone";
  const authorHref =
    communityPost && post.communitySlug
      ? `/communities/${post.communitySlug}`
      : post.authorId
        ? `/people/${post.authorId}`
        : `/feed/${post.id}`;
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
    <article className="border-0 pb-3.5">
      <header className={`flex items-center gap-2.5 py-2.5 ${edgeToEdge ? "px-4" : ""}`}>
        <Link
          href={authorHref}
          className="group flex min-w-0 flex-1 cursor-pointer items-center gap-2.5"
        >
          <Avatar
            initials={communityPost ? initialsFor(name) : post.initials}
            src={communityPost ? communityMediaUrl(post.communityAvatarPath) : post.avatarUrl}
            size="lg"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold tracking-tight text-ink group-hover:underline">
              {name}
            </span>
            {communityPost ? (
              post.communityDescription ? (
                <span className="block truncate text-[10px] text-muted">{post.communityDescription}</span>
              ) : null
            ) : post.role ? (
              <span className="block truncate text-[10px] text-muted">{post.role}</span>
            ) : null}
            <span className="flex items-center gap-1 text-[10px] text-muted">
              {timeAgo(post.createdAt)}
              <span aria-hidden="true">·</span>
              <Globe2 className="h-2.5 w-2.5" aria-label="Public post" />
            </span>
            {post.brandPartnership ? (
              <span className="block truncate text-[10px] font-medium text-inksoft">
                Paid partnership{post.brandPartnerName ? ` with ${post.brandPartnerName}` : ""}
              </span>
            ) : null}
            {post.collaborators?.length ? (
              <span className="block truncate text-[10px] text-muted">
                With {post.collaborators.map((person) => person.name).join(", ")}
              </span>
            ) : null}
          </span>
        </Link>
        {post.communityId && onJoinCommunity && !communityJoined ? (
          <button
            type="button"
            aria-label={`Join ${post.communityName ?? "community"}`}
            onClick={() => onJoinCommunity(post.communityId!)}
            disabled={communityBusy}
            className="flex h-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-lime-deep px-3 text-[11px] font-semibold text-white transition hover:bg-ink disabled:cursor-wait disabled:opacity-70"
          >
            {communityBusy ? "Joining…" : "Join"}
          </button>
        ) : !post.communityId && post.authorId && !post.mine && onToggleFollow ? (
          <button
            type="button"
            aria-pressed={followed}
            aria-label={followed ? `Following ${name}` : `Follow ${name}`}
            onClick={() => {
              if (post.authorId) onToggleFollow(post.authorId, followed);
            }}
            disabled={followBusy}
            className={`flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
              followed
                ? "text-inksoft hover:bg-cream"
                : "bg-lime text-dark hover:bg-lime-deep"
            }`}
          >
            {followed ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {followed ? "Following" : "Follow"}
          </button>
        ) : null}
        {onManage ? (
          <button
            type="button"
            aria-label="More post options"
            onClick={() => onManage(post)}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>
        ) : null}
      </header>

      {carried ? (
        <>
          {post.body ? <div className={edgeToEdge ? "px-4" : ""}>{words(post, long)}</div> : null}
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
                <span className="block truncate text-[10px] text-muted">
                  {timeAgo(carried.createdAt)}
                </span>
              </span>
              <Repeat2 className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={2} />
            </header>
            <PostBody entry={carried} />
            {carried.poll ? <CarriedPollBlock poll={carried.poll} /> : null}
            <Link
              href={`/feed/${carried.id}`}
              className="mt-2 inline-flex cursor-pointer text-[11px] font-semibold text-lime-deep hover:underline"
            >
              View original post
            </Link>
          </div>
        </>
      ) : (
        <>
          {post.title || parsedPost.body ? (
            <div className={edgeToEdge ? "px-4" : ""}>{words(cleanPost, long)}</div>
          ) : null}
          {post.media.length ? (
            <MediaStage
              media={post.media}
              postId={post.id}
              className={`${post.title || parsedPost.body ? "mt-2.5" : ""} ${
                edgeToEdge ? "rounded-none" : ""
              }`}
              rounded={!edgeToEdge}
            />
          ) : null}
          {parsedPost.document ? (
            <div className={edgeToEdge ? "px-4" : ""}>
              <DocumentStage document={parsedPost.document} />
            </div>
          ) : null}
        </>
      )}

      {poll && !carried ? (
        <div className={edgeToEdge ? "px-4" : ""}>
          <PollBlock
            poll={poll}
            signedIn={signedIn}
            onVote={(optionId) => onVote(post.id, optionId)}
          />
        </div>
      ) : null}

      <div className={`flex items-center gap-4 pb-1 pt-2.5 ${edgeToEdge ? "px-4" : ""}`}>
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? "Remove your upvote" : "Upvote this post"}
          title={liked ? "Remove upvote" : "Upvote"}
          onClick={() => onLike(post.id)}
          className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-ink transition hover:text-lime-deep"
        >
          <ThumbsUp
            className={`h-[18px] w-[18px] ${liked ? "fill-lime text-lime-deep" : ""}`}
            strokeWidth={liked ? 2.2 : 1.9}
          />
          {likes > 0 ? <span className="tabular-nums">{likes}</span> : null}
        </button>
        {post.canComment !== false ? (
          <button
            type="button"
            aria-label="Comment"
            onClick={() => onOpen(post.id)}
            className="flex cursor-pointer items-center gap-1.5 text-ink transition hover:text-lime-deep"
          >
            <MessageCircle className="h-[22px] w-[22px] -scale-x-100" strokeWidth={1.9} />
            {post.comments > 0 ? (
              <span className="text-[12px] font-bold tabular-nums">{post.comments}</span>
            ) : null}
          </button>
        ) : null}
        {/* A reshare of a reshare would carry an entry with nothing inside it, so the
            action is only offered on something somebody actually wrote. */}
        {!carried && (post.audience ?? "anyone") === "anyone" ? (
          <button
            type="button"
            aria-pressed={reshared}
            aria-label={reshared ? "Undo your reshare" : "Reshare to your own stream"}
            onClick={() => onReshare(post.id)}
            className={`flex cursor-pointer items-center gap-1.5 transition ${
              reshared ? "text-lime-deep" : "text-ink hover:text-lime-deep"
            }`}
          >
            <Repeat2 className="h-[22px] w-[22px]" strokeWidth={reshared ? 2.4 : 1.9} />
            {reshares > 0 ? (
              <span className="text-[12px] font-bold tabular-nums">{reshares}</span>
            ) : null}
          </button>
        ) : null}
        {(post.audience ?? "anyone") === "anyone" ? (
          <button
            type="button"
            aria-label="Share this post"
            onClick={() => onShare(post.id)}
            className="flex cursor-pointer items-center text-ink transition hover:text-lime-deep"
          >
            <Share2 className="h-[22px] w-[22px]" strokeWidth={1.9} />
          </button>
        ) : null}
        <span className="ml-auto text-[10.5px] tracking-[0.06em] text-faint">
          {timeAgo(post.createdAt)}
        </span>
      </div>

      {previewThread && post.comments > 0 ? (
        <div className={`mt-1.5 space-y-1 ${edgeToEdge ? "px-4" : ""}`}>
          {post.comments > post.recentComments.length ? (
            <button
              type="button"
              onClick={() => onOpen(post.id)}
              className="block cursor-pointer text-[12px] text-muted hover:text-ink"
            >
              View all {post.comments} comments
            </button>
          ) : null}
          {post.recentComments.map((comment) => (
            <div key={comment.id} className="flex gap-2 py-1">
              {comment.authorId ? (
                <Link
                  href={`/people/${comment.authorId}`}
                  aria-label={`View ${comment.fullName || "commenter"}'s profile`}
                  className="shrink-0"
                >
                  <Avatar initials={comment.initials} src={comment.avatarUrl} size="sm" />
                </Link>
              ) : (
                <Avatar initials={comment.initials} src={comment.avatarUrl} size="sm" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  {comment.authorId ? (
                    <Link
                      href={`/people/${comment.authorId}`}
                      className="truncate text-[11px] font-bold text-ink no-underline hover:no-underline"
                    >
                      {comment.fullName || "Someone"}
                    </Link>
                  ) : (
                    <span className="truncate text-[11px] font-bold text-ink">
                      {comment.fullName || "Someone"}
                    </span>
                  )}
                  <span className="shrink-0 text-[9px] text-faint">·</span>
                  <span className="shrink-0 text-[9px] text-faint">
                    {timeAgo(comment.createdAt)}
                  </span>
                </div>
                {comment.role ? (
                  <p className="truncate text-[9px] leading-tight text-muted">{comment.role}</p>
                ) : null}
                <p className="mt-1 text-[11.5px] leading-[1.5] text-ink [overflow-wrap:anywhere]">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!signedIn ? (
        <Link
          href="/sign-in"
          className="mt-2.5 inline-block cursor-pointer text-[11.5px] font-semibold text-lime-deep hover:underline"
        >
          Sign in to upvote, comment or reshare
        </Link>
      ) : null}
    </article>
  );
}
