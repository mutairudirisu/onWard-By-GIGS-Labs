"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Award,
  ArrowLeft,
  Check,
  ChevronRight,
  Flame,
  MessageCircle,
  PenLine,
  Plus,
  Users,
  X,
} from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { Avatar, PostBlock } from "@/components/feed-post";
import { Modal } from "@/components/modal";
import { PostOptionsSheet } from "@/components/post-options-sheet";
import { useSheetDrag } from "@/components/sheet-drag";
import { useAuth } from "@/components/auth";
import { toastError, toastSuccess } from "@/components/toast";
import {
  deletePost,
  fetchMyLikes,
  fetchPolls,
  fetchFollowList,
  fetchPersonComments,
  fetchPersonPosts,
  fetchProfileCard,
  followPerson,
  likePost,
  unlikePost,
  unfollowPerson,
  type ExchangePerson,
  type FeedPost,
  type PostPoll,
  type ProfileCard,
  type ProfileComment,
} from "@/lib/db";
import { timeAgo } from "@/lib/dates";
import { getExchangeAchievements, type ExchangeAchievement } from "@/lib/exchange-achievements";

type Tab = "posts" | "comments" | "about";

function AchievementIcon({ kind }: { kind: ExchangeAchievement["icon"] }) {
  if (kind === "post") return <PenLine className="h-4 w-4" aria-hidden="true" />;
  if (kind === "comment") return <MessageCircle className="h-4 w-4" aria-hidden="true" />;
  if (kind === "followers") return <Users className="h-4 w-4" aria-hidden="true" />;
  return <Flame className="h-4 w-4" aria-hidden="true" />;
}

/**
 * The brand mark, repeated as a quiet field behind the header. It is the same sprout
 * the wordmark grows from, drawn thin enough to read as paper grain, and it stops
 * where the tabs begin so the reading below sits on plain paper.
 */
function SproutField() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-lime-deep opacity-[0.18]"
    >
      <defs>
        <pattern
          id="profile-sprout-field"
          width="58"
          height="58"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-8)"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 20h10" />
            <path d="M10 20c5.5-2.5.8-6.4 3-10" />
            <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
            <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#profile-sprout-field)" />
    </svg>
  );
}

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
  const [polls, setPolls] = useState<Record<string, PostPoll>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likesLoaded, setLikesLoaded] = useState(false);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likeBusyIds, setLikeBusyIds] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<"followers" | "following" | null>(null);
  const [people, setPeople] = useState<ExchangePerson[] | null>(null);
  const [options, setOptions] = useState<FeedPost | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FeedPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCard(undefined);
    setPosts(null);
    setComments(null);
    setPolls({});
    setTab("posts");
    void (async () => {
      try {
        const [found, written] = await Promise.all([
          fetchProfileCard(id),
          fetchPersonPosts(id).catch((error) => {
            if (!cancelled) toastError(error instanceof Error ? error.message : "Couldn't load posts.");
            return [] as FeedPost[];
          }),
        ]);
        if (cancelled) return;
        setCard(found);
        setPosts(written);
        void fetchPolls(written.map((post) => post.id))
          .then((foundPolls) => {
            if (!cancelled) setPolls(foundPolls);
          })
          .catch((error) => {
            if (!cancelled) {
              toastError(error instanceof Error ? error.message : "Couldn't load poll details.");
            }
          });
      } catch {
        if (!cancelled) setCard(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setLikedPosts(new Set());
      setLikesLoaded(true);
      return;
    }
    setLikesLoaded(false);
    void fetchMyLikes()
      .then((liked) => {
        if (!cancelled) {
          setLikedPosts(liked);
          setLikesLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLikesLoaded(true);
          toastError("Couldn't load your post reactions.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const toggleLike = useCallback(
    (postId: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      if (!likesLoaded || likeBusyIds.has(postId)) return;
      const wasLiked = likedPosts.has(postId);
      const previousCount = likeCounts[postId] ?? posts?.find((post) => post.id === postId)?.likes ?? 0;
      const nextLiked = new Set(likedPosts);
      if (wasLiked) nextLiked.delete(postId);
      else nextLiked.add(postId);
      setLikedPosts(nextLiked);
      setLikeCounts((current) => ({
        ...current,
        [postId]: Math.max(0, previousCount + (wasLiked ? -1 : 1)),
      }));
      setLikeBusyIds((current) => new Set(current).add(postId));
      void (wasLiked ? unlikePost(postId) : likePost(postId))
        .catch(() => {
          setLikedPosts((current) => {
            const reverted = new Set(current);
            if (wasLiked) reverted.add(postId);
            else reverted.delete(postId);
            return reverted;
          });
          setLikeCounts((current) => ({ ...current, [postId]: previousCount }));
          toastError("Couldn't save that reaction.");
        })
        .finally(() => {
          setLikeBusyIds((current) => {
            const next = new Set(current);
            next.delete(postId);
            return next;
          });
        });
    },
    [likeBusyIds, likeCounts, likesLoaded, likedPosts, posts, router, user],
  );

  async function confirmDeletePost() {
    if (!pendingDelete || deleting) return;
    const target = pendingDelete;
    setDeleting(true);
    try {
      await deletePost(target.id);
      setPosts((current) => current?.filter((post) => post.id !== target.id) ?? []);
      setCard((current) => current
        ? { ...current, posts: Math.max(0, current.posts - 1) }
        : current,
      );
      setPendingDelete(null);
      toastSuccess("Post deleted");
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't delete that post.");
    } finally {
      setDeleting(false);
    }
  }

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
  const achievements = getExchangeAchievements({
    posts: card.posts,
    comments: card.comments,
    followers: card.followers,
    longestStreak: card.longestStreak,
  });
  const earnedAchievements = achievements.filter((achievement) => achievement.earned).length;

  return (
    <PhoneShell tab="feed">
      <div className="relative -mx-5 -mt-5 overflow-hidden bg-lime-soft px-5 pb-3 pt-5 md:mx-0 md:mt-0 md:rounded-3xl">
        <SproutField />
        <div className="relative mb-3 flex items-center gap-2">
          <Link
            href="/feed"
            aria-label="Back to the Exchange"
            className="-ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-lime-deep/30 bg-paper text-ink transition hover:bg-cream"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <h1 className="text-[13px] font-bold tracking-tight text-ink">Profile</h1>
        </div>

        <header className="relative">
        <div className="flex items-start gap-3">
          <Avatar initials={card.initials} src={card.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold tracking-tight text-ink">
              {card.fullName || "Someone"}
              {card.mine ? <span className="text-[11px] font-semibold text-muted"> (you)</span> : null}
            </p>
            {card.username ? (
              <p className="truncate text-[10.5px] font-medium text-muted">@{card.username}</p>
            ) : null}
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

        <button
          type="button"
          onClick={() => setAchievementsOpen(true)}
          aria-label={`${earnedAchievements} achievements`}
          className="mt-3 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-lime-deep/20 bg-paper/70 px-3 py-2.5 text-left transition hover:bg-paper"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-pale text-lime-deep">
            <Award className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold text-ink">
              {earnedAchievements} achievements
            </span>
            <span className="block truncate text-[9.5px] text-muted">
              Milestones from your Exchange activity
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
        </button>

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
      </div>

      {/* Three equal columns edge to edge, the way a profile's sections read on a
          phone: the whole width is the tab bar, not a row of loose words. */}
      <nav className="mt-4 grid grid-cols-3 border-b border-line" aria-label="Profile sections">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            aria-current={tab === item.key}
            className={`cursor-pointer pb-2 pt-1 text-[11.5px] font-semibold transition ${
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
              <div key={post.id} className="border-b border-line">
                <PostBlock
                  post={post}
                  liked={likedPosts.has(post.id)}
                  likes={likeCounts[post.id] ?? post.likes}
                  reshares={post.reshares}
                  reshared={post.reshared}
                  signedIn={Boolean(user)}
                  poll={polls[post.id] ?? null}
                  onVote={(postId) => router.push(`/feed/${postId}`)}
                  onLike={toggleLike}
                  onReshare={(postId) => router.push(`/feed/${postId}`)}
                  onShare={(postId) => router.push(`/feed/${postId}`)}
                  onOpen={(postId) => router.push(`/feed/${postId}`)}
                  onManage={setOptions}
                  followed={post.authorId === id && card.followed}
                  followBusy={busy}
                  onToggleFollow={() => toggleFollow()}
                />
              </div>
            ))
          ) : (
            <div className="mx-4 my-4 rounded-2xl border border-dash bg-cream/60 px-5 py-8 text-center">
              <MessageCircle className="mx-auto h-6 w-6 text-lime-deep" aria-hidden="true" />
              <h2 className="mt-2 text-[13px] font-semibold text-ink">
                {card.mine ? "You don't have any posts yet" : "No posts yet"}
              </h2>
              <p className="mt-1 text-[11px] leading-[1.5] text-muted">
                {card.mine
                  ? "Your Exchange posts will show up here."
                  : "When they share a post in the Exchange, it will appear here."}
              </p>
              {card.mine ? (
                <Link
                  href="/feed/new"
                  className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-[11px] font-bold text-dark transition hover:bg-lime-deep"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create your first post
                </Link>
              ) : null}
            </div>
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

      <Modal
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
        title={<span id="exchange-achievements-title">Exchange achievements</span>}
        labelledBy="exchange-achievements-title"
      >
        <p className="mb-2 text-[11px] leading-[1.5] text-muted">
          {earnedAchievements} of {achievements.length} milestones earned through posts,
          conversations, followers, and streaks.
        </p>
        <ul className="divide-y divide-line">
          {achievements.map((achievement) => (
            <li key={achievement.id} className="flex items-start gap-3 py-3">
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  achievement.earned
                    ? "bg-lime-pale text-lime-deep"
                    : "bg-cream text-muted"
                }`}
              >
                <AchievementIcon kind={achievement.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11.5px] font-semibold text-ink">{achievement.title}</p>
                  {achievement.earned ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[9.5px] font-semibold text-lime-deep">
                      <Check className="h-3 w-3" />
                      Earned
                    </span>
                  ) : (
                    <span className="shrink-0 text-[9.5px] tabular-nums text-muted">
                      {Math.min(achievement.value, achievement.target)} / {achievement.target}{" "}
                      {achievement.unit}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] leading-[1.45] text-muted">
                  {achievement.description}
                </p>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream"
                  role="progressbar"
                  aria-label={`${achievement.title} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={achievement.progressPercent}
                >
                  <span
                    className="block h-full rounded-full bg-lime-deep transition-[width]"
                    style={{ width: `${achievement.progressPercent}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Modal>

      <PostOptionsSheet
        post={options}
        reshared={options?.reshared ?? false}
        open={Boolean(options)}
        onClose={() => setOptions(null)}
        onShare={(postId) => router.push(`/feed/${postId}`)}
        onReshare={(postId) => router.push(`/feed/${postId}`)}
        onDelete={setPendingDelete}
      />

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        title="Delete this post?"
      >
        <p className="text-[11px] leading-relaxed text-inksoft">
          This removes your post and its attachments from the Exchange.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setPendingDelete(null)}
            className="flex-1 rounded-full border border-line px-4 py-2.5 text-[11px] font-semibold text-inksoft disabled:opacity-50"
          >
            Keep post
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void confirmDeletePost()}
            className="flex-1 rounded-full bg-danger px-4 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>

      <PeopleSheet
        people={people}
        title={sheet === "following" ? "Following" : "Followers"}
        open={Boolean(sheet)}
        onClose={() => setSheet(null)}
      />
    </PhoneShell>
  );
}
