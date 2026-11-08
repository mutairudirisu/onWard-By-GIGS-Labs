"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, ThumbsUp, X } from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { Avatar } from "@/components/feed-post";
import { PostText } from "@/components/post-text";
import { useSheetDrag } from "@/components/sheet-drag";
import { useAuth } from "@/components/auth";
import { toastError } from "@/components/toast";
import {
  fetchFollowList,
  fetchPersonComments,
  fetchPersonPosts,
  fetchProfileCard,
  followPerson,
  unfollowPerson,
  type ExchangePerson,
  type FeedPost,
  type ProfileCard,
  type ProfileComment,
} from "@/lib/db";
import { timeAgo } from "@/lib/dates";

type Tab = "posts" | "comments" | "about";

/** The list behind the follower and following numbers: names, nothing else. */
function PeopleSheet({
  people,
  title,
  open,
  onClose,
}: {
  people: ExchangePerson[] | null;
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  const { gripProps, shellStyle } = useSheetDrag(open, onClose);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-ink/45"
        style={{ animation: "onward-fade 0.15s ease-out" }}
        onClick={onClose}
      />
      <div
        className="relative mt-auto flex max-h-[70vh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-3xl bg-paper shadow-lift"
        style={shellStyle}
      >
        <div
          {...gripProps()}
          className="shrink-0 cursor-grab touch-none px-4 pb-1 pt-2.5 active:cursor-grabbing"
          aria-label="Drag to close"
        >
          <span className="mx-auto block h-1 w-10 rounded-full bg-line" />
        </div>
        <div className="flex shrink-0 items-center gap-3 px-4 pb-2">
          <p className="flex-1 text-[13px] font-bold tracking-tight text-ink">{title}</p>
          <button
            type="button"
            aria-label={`Close ${title.toLowerCase()}`}
            onClick={onClose}
            className="-mr-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:text-ink"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="wheel min-h-0 flex-1 overflow-y-auto border-t border-line pb-4">
          {people === null ? (
            <p className="px-4 py-6 text-[11.5px] text-muted">Loading…</p>
          ) : people.length ? (
            people.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                onClick={onClose}
                className="flex cursor-pointer items-center gap-2.5 border-b border-line px-4 py-2.5 last:border-b-0"
              >
                <Avatar initials={person.initials} src={person.avatarUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-semibold text-ink">
                    {person.name || "Someone"}
                  </span>
                  {person.role ? (
                    <span className="block truncate text-[10px] text-muted">{person.role}</span>
                  ) : null}
                </span>
              </Link>
            ))
          ) : (
            <p className="px-4 py-6 text-[11.5px] text-muted">Nobody here yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Somebody in the Exchange, the way the rest of the app shows them: their name and what
 * they have written, their numbers, and one button that follows or unfollows. Nothing on
 * this page is private that was not already public - a post is public the moment it is
 * made, and these numbers count those posts.
 */
export default function PersonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id;

  const [card, setCard] = useState<ProfileCard | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [comments, setComments] = useState<ProfileComment[] | null>(null);
  const [sheet, setSheet] = useState<"followers" | "following" | null>(null);
  const [people, setPeople] = useState<ExchangePerson[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCard(undefined);
    setPosts(null);
    setComments(null);
    setTab("posts");
    void (async () => {
      try {
        const [found, written] = await Promise.all([
          fetchProfileCard(id),
          fetchPersonPosts(id).catch(() => [] as FeedPost[]),
        ]);
        if (cancelled) return;
        setCard(found);
        setPosts(written);
      } catch {
        if (!cancelled) setCard(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // The Comments tab is read when it is first opened, not on arrival: a profile with a
  // thousand replies should not cost a stranger a thousand rows.
  useEffect(() => {
    if (tab !== "comments" || comments !== null) return;
    let cancelled = false;
    void fetchPersonComments(id)
      .then((rows) => {
        if (!cancelled) setComments(rows);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, comments, id]);

  useEffect(() => {
    if (!sheet) return;
    let cancelled = false;
    setPeople(null);
    void fetchFollowList(id, sheet)
      .then((rows) => {
        if (!cancelled) setPeople(rows);
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sheet, id]);

  /** The number moves at once; a refusal puts it back. */
  const toggleFollow = useCallback(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    if (!card || busy) return;
    const turningOn = !card.followed;
    setCard({ ...card, followed: turningOn, followers: Math.max(0, card.followers + (turningOn ? 1 : -1)) });
    setBusy(true);
    void (turningOn ? followPerson(id) : unfollowPerson(id))
      .catch(() => {
        setCard((prev) =>
          prev
            ? { ...prev, followed: !turningOn, followers: Math.max(0, prev.followers + (turningOn ? -1 : 1)) }
            : prev,
        );
        toastError("Couldn't save that");
      })
      .finally(() => setBusy(false));
  }, [busy, card, id, router, user]);

  if (card === undefined) {
    return (
      <PhoneShell tab="feed">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 rounded bg-cream" />
          <div className="h-[52px] w-[52px] rounded-full bg-cream" />
          <div className="h-3 w-40 rounded bg-cream" />
          <div className="h-3 w-full rounded bg-cream" />
          <div className="h-3 w-2/3 rounded bg-cream" />
        </div>
      </PhoneShell>
    );
  }

  if (card === null) {
    return (
      <PhoneShell tab="feed">
        <div className="card px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">This profile is out of reach.</p>
          <p className="tiny mt-1">The person may have left, or the link is not right.</p>
          <p className="mt-4">
            <Link
              href="/feed"
              className="cursor-pointer text-[11px] font-bold text-lime-deep hover:underline"
            >
              Back to the Exchange
            </Link>
          </p>
        </div>
      </PhoneShell>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "posts", label: "Posts" },
    { key: "comments", label: "Comments" },
    { key: "about", label: "About" },
  ];

  return (
    <PhoneShell tab="feed">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href="/feed"
          aria-label="Back to the Exchange"
          className="-ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Link>
        <h1 className="text-[13px] font-bold tracking-tight text-ink">Profile</h1>
      </div>

      <header>
        <div className="flex items-start gap-3">
          <Avatar initials={card.initials} src={card.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold tracking-tight text-ink">
              {card.fullName || "Someone"}
              {card.mine ? <span className="text-[11px] font-semibold text-muted"> (you)</span> : null}
            </p>
            {card.role ? <p className="truncate text-[11px] text-muted">{card.role}</p> : null}
            {card.location ? <p className="truncate text-[10.5px] text-faint">{card.location}</p> : null}
          </div>
        </div>

        {card.bio ? (
          <p className="mt-2.5 text-[11.5px] leading-[1.55] text-inksoft [overflow-wrap:anywhere]">
            {card.bio}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-4 border-y border-line py-2.5">
          <span className="text-[10.5px] text-muted tabular-nums">
            <span className="font-bold text-ink">{card.posts}</span> posts
          </span>
          <span className="text-[10.5px] text-muted tabular-nums">
            <span className="font-bold text-ink">{card.comments}</span> comments
          </span>
          <button
            type="button"
            onClick={() => setSheet("followers")}
            className="cursor-pointer text-[10.5px] text-muted tabular-nums transition hover:text-ink"
          >
            <span className="font-bold text-ink">{card.followers}</span> followers
          </button>
          <button
            type="button"
            onClick={() => setSheet("following")}
            className="cursor-pointer text-[10.5px] text-muted tabular-nums transition hover:text-ink"
          >
            <span className="font-bold text-ink">{card.following}</span> following
          </button>
        </div>

        {card.mine ? (
          <Link
            href="/profile"
            className="mt-3 flex w-full cursor-pointer items-center justify-center rounded-btn border border-line bg-paper px-4 py-2.5 text-[12.5px] font-semibold text-ink transition hover:bg-cream"
          >
            Edit your profile
          </Link>
        ) : (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={busy}
            aria-pressed={card.followed}
            className={`mt-3 flex w-full cursor-pointer items-center justify-center rounded-btn px-4 py-2.5 text-[12.5px] font-bold transition ${
              card.followed
                ? "border border-line bg-paper text-ink hover:bg-cream"
                : "bg-lime text-dark hover:bg-lime-deep"
            }`}
          >
            {card.followed ? "Following" : "Follow"}
          </button>
        )}
      </header>

      <nav className="mt-4 flex gap-1 border-b border-line" aria-label="Profile sections">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            aria-current={tab === item.key}
            className={`cursor-pointer px-3 pb-2 pt-1 text-[11.5px] font-semibold transition ${
              tab === item.key
                ? "border-b-2 border-lime-deep text-ink"
                : "border-b-2 border-transparent text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "posts" ? (
        <section className="mt-1" aria-label="Their posts">
          {posts === null ? (
            <p className="py-6 text-[11.5px] text-muted">Loading…</p>
          ) : posts.length ? (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/feed/${post.id}`}
                className="block cursor-pointer border-b border-line py-3"
              >
                {post.title ? (
                  <p className="text-[12.5px] font-bold leading-[1.35] tracking-tight text-ink [overflow-wrap:anywhere]">
                    {post.title}
                  </p>
                ) : null}
                {post.body ? (
                  <PostText
                    text={post.body}
                    className={`line-clamp-2 text-[11.5px] leading-[1.5] text-ink ${
                      post.title ? "mt-0.5" : ""
                    }`}
                  />
                ) : null}
                {!post.title && !post.body ? (
                  <p className="text-[11.5px] italic text-muted">
                    {post.media.length ? "A post of photos and clips" : "A poll"}
                  </p>
                ) : null}
                <p className="mt-1.5 flex items-center gap-3 text-[9.5px] text-faint tabular-nums">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" strokeWidth={2} /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" strokeWidth={2} /> {post.comments}
                  </span>
                  {post.reshares ? <span>{post.reshares} reposts</span> : null}
                  <span>{timeAgo(post.createdAt)}</span>
                </p>
              </Link>
            ))
          ) : (
            <p className="py-6 text-[11.5px] text-muted">Nothing written here yet.</p>
          )}
        </section>
      ) : null}

      {tab === "comments" ? (
        <section className="mt-1" aria-label="Their comments">
          {comments === null ? (
            <p className="py-6 text-[11.5px] text-muted">Loading…</p>
          ) : comments.length ? (
            comments.map((comment) => (
              <Link
                key={comment.id}
                href={`/feed/${comment.postId}`}
                className="block cursor-pointer border-b border-line py-3"
              >
                <p className="text-[11.5px] leading-[1.5] text-ink [overflow-wrap:anywhere]">
                  {comment.body}
                </p>
                <p className="mt-1 truncate text-[9.5px] text-faint">
                  on {comment.postTitle || comment.postBody.slice(0, 40) || "a post"} ·{" "}
                  {comment.postAuthor || "someone"} · {timeAgo(comment.createdAt)}
                </p>
              </Link>
            ))
          ) : (
            <p className="py-6 text-[11.5px] text-muted">No comments yet.</p>
          )}
        </section>
      ) : null}

      {tab === "about" ? (
        <section className="mt-3 space-y-2.5" aria-label="About them">
          <p className="text-[11.5px] leading-[1.6] text-inksoft">
            {card.bio || `${card.fullName || "This person"} has not written anything about themselves yet.`}
          </p>
          <p className="text-[10.5px] text-muted">
            {card.role ? `${card.role} · ` : ""}
            Joined {timeAgo(card.joinedAt)} ago
          </p>
          <p className="rounded-xl border border-dash px-3.5 py-3 text-[9.5px] leading-[1.55] text-muted">
            A profile shows what is already public in the Exchange: the name somebody chose, their
            posts and comments, and how many people follow them. Email, settings and onWards stay
            private, and following someone is a note on your own account, not a message to them.
          </p>
        </section>
      ) : null}

      <PeopleSheet
        people={people}
        title={sheet === "following" ? "Following" : "Followers"}
        open={Boolean(sheet)}
        onClose={() => setSheet(null)}
      />
    </PhoneShell>
  );
}
