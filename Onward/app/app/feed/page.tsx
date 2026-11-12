"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Clock3,
  Compass,
  Home,
  Menu,
  MessagesSquare,
  Search,
  Settings,
  Sprout,
  Trash2,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { FeedSkeleton } from "@/components/skeleton";
import { Modal } from "@/components/modal";
import { CommentsSheet } from "@/components/comments-sheet";
import { ExchangeShareSheet, type ShareTarget } from "@/components/exchange-share-sheet";
import { ExchangeSearchSheet } from "@/components/exchange-search-sheet";
import { Avatar, PostBlock } from "@/components/feed-post";
import { withVote } from "@/components/post-poll";
import { ReshareSheet, type ReshareTarget } from "@/components/reshare-sheet";
import { PostOptionsSheet } from "@/components/post-options-sheet";
import { useAuth, useCurrentUser } from "@/components/auth";
import { useNotifications } from "@/components/notifications";
import { Wordmark } from "@/components/wordmark";
import { toastError, toastSuccess, toastUndoable } from "@/components/toast";
import { askAfterUpvote } from "@/lib/feedback";
import { timeAgo } from "@/lib/dates";
import {
  deletePost,
  fetchFeed,
  fetchFollowList,
  fetchMyInteractions,
  fetchMyLikes,
  fetchPolls,
  fetchSharedWithMe,
  followPerson,
  likePost,
  reshare,
  unlikePost,
  unreshare,
  unfollowPerson,
  voteInPoll,
  type FeedInteraction,
  type FeedPost,
  type PostPoll,
  type SharedPost,
} from "@/lib/db";

/** How often the Exchange checks for updates without rearranging the list. */
const REFRESH_MS = 60_000;

type FeedTab = "for-you" | "following" | "popular";

const FEED_TABS: { id: FeedTab; label: string }[] = [
  { id: "for-you", label: "For You" },
  { id: "following", label: "Following" },
  { id: "popular", label: "Popular" },
];

function mergeNumberMap(current: Record<string, number>, updates: Record<string, number>) {
  if (!Object.entries(updates).some(([id, value]) => current[id] !== value)) return current;
  return { ...current, ...updates };
}

function interactionLine(item: FeedInteraction, post: FeedPost) {
  const who = post.mine ? "your" : `${post.fullName || "someone"}'s`;
  const target = post.media.length ? `${who} photo` : `${who} post`;
  if (item.kind === "like") return `You upvoted ${target}`;
  return item.body ? `You said: ${item.body}` : `You commented on ${target}`;
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-3 py-3">
      <h2 className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
        {title}
      </h2>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-[12px] font-medium text-ink transition hover:bg-cream"
    >
      <span className="text-muted">{icon}</span>
      {label}
    </Link>
  );
}

function MenuFilter({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[12px] font-medium transition ${
        active ? "bg-lime-pale text-ink" : "text-ink hover:bg-cream"
      }`}
    >
      <span className={active ? "text-lime-deep" : "text-muted"}>{icon}</span>
      {label}
    </button>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { user } = useAuth();
  const me = useCurrentUser();
  const { unread } = useNotifications();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [pendingPosts, setPendingPosts] = useState<FeedPost[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reshared, setReshared] = useState<Set<string>>(new Set());
  const [reshareCounts, setReshareCounts] = useState<Record<string, number>>({});
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followStatusReady, setFollowStatusReady] = useState(false);
  const [followBusyIds, setFollowBusyIds] = useState<Set<string>>(new Set());
  const [feedTab, setFeedTab] = useState<FeedTab>("for-you");
  const [options, setOptions] = useState<FeedPost | null>(null);
  const [pending, setPending] = useState<FeedPost | null>(null);
  const [thread, setThread] = useState<string | null>(null);
  const [sharing, setSharing] = useState<ShareTarget | null>(null);
  const [reposting, setReposting] = useState<ReshareTarget | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [engaged, setEngaged] = useState<FeedInteraction[]>([]);
  const [handed, setHanded] = useState<SharedPost[]>([]);
  const [polls, setPolls] = useState<Record<string, PostPoll>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Every read of the Exchange carries a token, so a slow answer cannot land on top
  // of a newer one.
  const inflight = useRef(0);
  const postsRef = useRef<FeedPost[]>([]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const load = useCallback(() => {
    const token = ++inflight.current;
    setState("loading");
    setFollowStatusReady(!user);
    Promise.all([
      fetchFeed(),
      // A visitor has nothing of their own to read, and those tables would refuse
      // the query anyway.
      user ? fetchMyLikes().catch(() => new Set<string>()) : Promise.resolve(new Set<string>()),
      user ? fetchMyInteractions().catch(() => [] as FeedInteraction[]) : Promise.resolve([]),
      user ? fetchSharedWithMe().catch(() => [] as SharedPost[]) : Promise.resolve([]),
      user
        ? fetchFollowList(user.id, "following").catch(() => null)
        : Promise.resolve([]),
    ])
      .then(([next, likedSet, interactions, shared, following]) => {
        if (token !== inflight.current) return;
        postsRef.current = next;
        setPosts(next);
        setPendingPosts([]);
        setLiked(likedSet);
        setCounts(Object.fromEntries(next.map((post) => [post.id, post.likes])));
        setReshared(new Set(next.filter((post) => post.reshared).map((post) => post.id)));
        setReshareCounts(Object.fromEntries(next.map((post) => [post.id, post.reshares])));
        setEngaged(interactions);
        setHanded(shared);
        if (following === null) {
          setFollowStatusReady(false);
          toastError("Couldn't load follow status");
        } else {
          setFollowedIds(new Set(following.map((person) => person.id)));
          setFollowStatusReady(true);
        }
        setState("ready");
        // Polls are a second read: a post page is worth seeing even when the poll
        // table has not been created yet, so a failure here only means no polls.
        void fetchPolls(next.map((post) => post.id))
          .then((found) => {
            if (token === inflight.current) setPolls(found);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (token === inflight.current) setState("error");
      });
  }, [user]);

  const toggleFollowAuthor = useCallback(
    (authorId: string, currentlyFollowing: boolean) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      if (followBusyIds.has(authorId)) return;
      setFollowBusyIds((current) => new Set(current).add(authorId));
      setFollowedIds((current) => {
        const next = new Set(current);
        if (currentlyFollowing) next.delete(authorId);
        else next.add(authorId);
        return next;
      });
      void (currentlyFollowing ? unfollowPerson(authorId) : followPerson(authorId))
        .catch(() => {
          setFollowedIds((current) => {
            const next = new Set(current);
            if (currentlyFollowing) next.add(authorId);
            else next.delete(authorId);
            return next;
          });
          toastError("Couldn't save that");
        })
        .finally(() => {
          setFollowBusyIds((current) => {
            const next = new Set(current);
            next.delete(authorId);
            return next;
          });
        });
    },
    [followBusyIds, router, user],
  );

  /**
   * The quiet read behind the first one: the timeline and its polls, nothing else. A
   * post written on someone else's phone arrives here without anyone reloading, while
   * the taps you have just made stay exactly as you left them.
   */
  const refresh = useCallback(() => {
    const token = ++inflight.current;
    void fetchFeed()
      .then((next) => {
        if (token !== inflight.current) return;
        const knownIds = new Set(postsRef.current.map((post) => post.id));
        const incoming = next.filter((post) => !knownIds.has(post.id));
        if (incoming.length) {
          setPendingPosts((current) => {
            const alreadyQueued = new Set([
              ...knownIds,
              ...current.map((post) => post.id),
            ]);
            const added = incoming.filter((post) => !alreadyQueued.has(post.id));
            return added.length ? [...added, ...current] : current;
          });
        }
      })
      .catch(() => {
        /* a quiet read that fails leaves the timeline as it was */
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      inflight.current++;
    };
  }, [load]);

  /**
   * Read quietly while the page is visible. New posts are held until the reader
   * chooses to add them, so a refresh never shifts the list under their finger.
   */
  useEffect(() => {
    if (state !== "ready") return;
    let missed = false;
    let lastAt = Date.now();

    const nearTop = () => window.scrollY < 120;
    const run = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastAt < 4000) return;
      if (!nearTop()) {
        missed = true;
        return;
      }
      missed = false;
      lastAt = now;
      refresh();
    };
    const onScroll = () => {
      if (missed) run();
    };

    const timer = window.setInterval(run, REFRESH_MS);
    document.addEventListener("visibilitychange", run);
    window.addEventListener("focus", run);
    window.addEventListener("online", run);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", run);
      window.removeEventListener("focus", run);
      window.removeEventListener("online", run);
      window.removeEventListener("scroll", onScroll);
    };
  }, [refresh, state]);

  const toggleLike = useCallback(
    (id: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      const turningOn = !liked.has(id);
      const apply = (on: boolean) => {
        setLiked((prev) => {
          const next = new Set(prev);
          if (on) next.add(id);
          else next.delete(id);
          return next;
        });
        setCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (on ? 1 : -1)) }));
      };
      apply(turningOn);
      void (turningOn ? likePost(id) : unlikePost(id))
        // An upvote is the moment someone is enjoying the app, so it is the moment to
        // ask - but only once the tap is actually saved, not on a failure.
        .then(() => {
          if (turningOn) askAfterUpvote();
        })
        .catch(() => {
          apply(!turningOn);
          toastError("Couldn't save that");
        });
    },
    [liked, router, user],
  );

  const applyReshare = useCallback((id: string, on: boolean) => {
    setReshared((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
    setReshareCounts((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + (on ? 1 : -1)),
    }));
  }, []);

  const undoReshare = useCallback(
    (id: string) => {
      applyReshare(id, false);
      void unreshare(id).catch(() => {
        applyReshare(id, true);
        toastError("Couldn't undo that");
      });
    },
    [applyReshare],
  );

  /** A repost you have already made comes straight back; a new one opens the thought
   *  box first, and taking it back afterwards is what the toast is for. */
  const tapReshare = useCallback(
    (id: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      if (reshared.has(id)) {
        undoReshare(id);
        return;
      }
      const post = posts.find((row) => row.id === id);
      if (!post) return;
      setReposting({ id: post.id, title: post.title, body: post.body, fullName: post.fullName });
    },
    [posts, reshared, router, undoReshare, user],
  );

  // A repost is its own post, so a failure cannot leave a half-made one behind.
  async function confirmRepost(thought: string) {
    const target = reposting;
    if (!target) return;
    setReposting(null);
    applyReshare(target.id, true);
    try {
      await reshare(target.id, thought);
      toastUndoable("Reposted", "Undo", () => undoReshare(target.id));
    } catch {
      applyReshare(target.id, false);
      toastError("Couldn't save that");
    }
  }

  /**
   * Voting is optimistic, because the tap should feel like it landed. The database holds
   * the rule - one vote per person, and nothing after the close - so a refusal only puts
   * the poll back the way it was read.
   */
  const votePoll = useCallback(
    (postId: string, optionId: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      const poll = polls[postId];
      if (!poll || poll.closed || poll.myOptionId === optionId) return;
      const previous = poll;
      setPolls((prev) => ({ ...prev, [postId]: withVote(previous, optionId) }));
      void voteInPoll(optionId).catch(() => {
        setPolls((prev) => ({ ...prev, [postId]: previous }));
        toastError("Couldn't record that vote");
      });
    },
    [polls, router, user],
  );

  const openShare = useCallback(
    (id: string) => {
      if (!user) {
        router.push("/sign-in");
        return;
      }
      const post = posts.find((row) => row.id === id);
      if (!post) return;
      setSharing({ id: post.id, title: post.title, body: post.body, fullName: post.fullName });
    },
    [posts, router, user],
  );

  const shown = useMemo(() => {
    let rows = posts;
    if (feedTab === "following") {
      rows = rows.filter((post) => post.authorId && followedIds.has(post.authorId));
    } else if (feedTab === "popular") {
      rows = [...rows].sort((a, b) => {
        const scoreA = (counts[a.id] ?? a.likes) + a.comments * 2 + a.reshares * 3;
        const scoreB = (counts[b.id] ?? b.likes) + b.comments * 2 + b.reshares * 3;
        return scoreB - scoreA || Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
    }
    return rows;
  }, [counts, feedTab, followedIds, posts]);

  const pendingToShow =
    feedTab === "following"
      ? pendingPosts.filter((post) => post.authorId && followedIds.has(post.authorId))
      : pendingPosts;

  const showPendingPosts = () => {
    const incoming = pendingToShow;
    if (!incoming.length) return;
    const incomingIds = new Set(incoming.map((post) => post.id));
    setPosts((current) => {
      const currentIds = new Set(current.map((post) => post.id));
      const added = incoming.filter((post) => !currentIds.has(post.id));
      return [...added, ...current].slice(0, 40);
    });
    setCounts((current) =>
      mergeNumberMap(
        current,
        Object.fromEntries(incoming.map((post) => [post.id, post.likes])),
      ),
    );
    setReshareCounts((current) =>
      mergeNumberMap(
        current,
        Object.fromEntries(incoming.map((post) => [post.id, post.reshares])),
      ),
    );
    setReshared((current) => {
      const next = new Set(current);
      for (const post of incoming) {
        if (post.reshared) next.add(post.id);
        else next.delete(post.id);
      }
      return next;
    });
    setPendingPosts((current) => current.filter((post) => !incomingIds.has(post.id)));
    void fetchPolls(incoming.map((post) => post.id))
      .then((found) => setPolls((current) => ({ ...current, ...found })))
      .catch(() => {});
  };

  // Only the things still on the feed: a row whose post has gone has no name to show
  // and nothing left to open.
  const recent = useMemo(() => {
    const byId = new Map(posts.map((post) => [post.id, post]));
    const out: { item: FeedInteraction; post: FeedPost }[] = [];
    for (const item of engaged) {
      const post = byId.get(item.postId);
      if (!post) continue;
      out.push({ item, post });
      if (out.length === 3) break;
    }
    return out;
  }, [engaged, posts]);

  async function removePost(post: FeedPost) {
    setPending(null);
    try {
      await deletePost(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toastSuccess("Post deleted");
    } catch {
      toastError("Couldn't delete the post");
    }
  }

  return (
    <PhoneShell tab="feed" wide>
      <div className="-mx-5 md:mx-0">
      <div className="mx-auto w-full max-w-[840px] xl:grid xl:grid-cols-[minmax(0,560px)_minmax(220px,240px)] xl:items-start xl:gap-6">
      <div className="mx-auto min-w-0 lg:max-w-[560px] xl:mx-0">
      <div className="relative mb-2 flex items-center px-4 md:px-0">
        <button
          type="button"
          aria-label="Open Exchange menu"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen(true);
          }}
          className="-ml-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-cream"
        >
          <Menu className="h-[22px] w-[22px]" strokeWidth={2.1} />
        </button>
        <button
          type="button"
          aria-label="Search the Exchange"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-full border border-line bg-cream px-3 text-left text-[11px] text-muted transition hover:border-dash hover:text-ink"
        >
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate">Search the Exchange</span>
        </button>
        <Link
          href="/notifications"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative ml-2 flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-paper px-3 text-muted transition hover:bg-lime-pale"
        >
          <span className="relative flex">
            <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-paper" />
            ) : null}
          </span>
          {unread > 0 ? (
            <span className="text-[11px] font-medium tabular-nums text-muted">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Link>
      </div>

      <nav className="mb-2 grid grid-cols-3 border-b border-line px-3" aria-label="Exchange feed">
        {FEED_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={feedTab === item.id ? "page" : undefined}
            onClick={() => {
              setFeedTab(item.id);
            }}
            className={`cursor-pointer border-b-2 px-2 py-2.5 text-[11px] font-semibold transition ${
              feedTab === item.id
                ? "border-lime-deep text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {pendingToShow.length ? (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[35] flex justify-center px-4 lg:bottom-6">
          <button
            type="button"
            onClick={showPendingPosts}
            className="cursor-pointer rounded-full bg-ink px-4 py-2.5 text-[10px] font-bold text-white shadow-lift transition hover:bg-lime-deep hover:text-ink"
          >
            {pendingToShow.length} new {pendingToShow.length === 1 ? "post" : "posts"} · Show
          </button>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close Exchange menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/45"
          />
          <aside
            aria-label="Exchange navigation"
            className="absolute inset-y-0 left-0 flex w-[min(84vw,340px)] flex-col overflow-y-auto rounded-r-3xl bg-paper pb-8 shadow-lift"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <Wordmark className="text-[17px]" />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <nav className="px-3 py-3" aria-label="Main">
              <MenuFilter
                icon={<Home className="h-5 w-5" />}
                label="For You"
                active={feedTab === "for-you"}
                onClick={() => {
                  setFeedTab("for-you");
                  setMenuOpen(false);
                }}
              />
              <MenuFilter
                icon={<UsersRound className="h-5 w-5" />}
                label="Following"
                active={feedTab === "following"}
                onClick={() => {
                  setFeedTab("following");
                  setMenuOpen(false);
                }}
              />
              <MenuFilter
                icon={<TrendingUp className="h-5 w-5" />}
                label="Popular"
                active={feedTab === "popular"}
                onClick={() => {
                  setFeedTab("popular");
                  setMenuOpen(false);
                }}
              />
            </nav>
            <MenuSection title="Create">
              <MenuLink href={user ? "/feed/new" : "/sign-in"} icon={<MessagesSquare className="h-5 w-5" />} label="New post" onClick={() => setMenuOpen(false)} />
              <MenuLink href={user ? "/feed/new?mode=poll" : "/sign-in"} icon={<TrendingUp className="h-5 w-5" />} label="New poll" onClick={() => setMenuOpen(false)} />
              <MenuLink href={user ? "/onwards/new" : "/sign-in"} icon={<Sprout className="h-5 w-5" />} label="Log an onWard" onClick={() => setMenuOpen(false)} />
            </MenuSection>
            <MenuSection title="Your onWard">
              <MenuLink href="/network" icon={<UsersRound className="h-5 w-5" />} label="My Network" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/onwards" icon={<Clock3 className="h-5 w-5" />} label="My onWards" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/profile" icon={<UserRound className="h-5 w-5" />} label="Profile" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/notifications" icon={<Bell className="h-5 w-5" />} label="Notifications" onClick={() => setMenuOpen(false)} />
            </MenuSection>
            <MenuSection title="Explore">
              <MenuLink href="/network" icon={<Compass className="h-5 w-5" />} label="Discover people" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/communities" icon={<UsersRound className="h-5 w-5" />} label="Discover communities" onClick={() => setMenuOpen(false)} />
              <MenuLink href={user ? "/communities/new" : "/sign-in"} icon={<UsersRound className="h-5 w-5" />} label="Start a community" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/portfolio" icon={<BriefcaseBusiness className="h-5 w-5" />} label="Portfolio" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/settings" icon={<Settings className="h-5 w-5" />} label="Settings" onClick={() => setMenuOpen(false)} />
              <MenuLink href="/insights" icon={<Bookmark className="h-5 w-5" />} label="Insights" onClick={() => setMenuOpen(false)} />
            </MenuSection>
          </aside>
        </div>
      ) : null}

      <div className="card mb-3.5 hidden items-center gap-3 p-3 xl:flex">
        <Avatar
          initials={me.initials || (me.name.slice(0, 1).toUpperCase() || "?")}
          src={me.avatarUrl}
          size="md"
        />
        <Link
          href={user ? "/feed/new" : "/sign-in"}
          className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-line bg-cream px-4 text-[11px] text-muted transition hover:border-dash hover:text-ink"
        >
          Share a win, idea or resource…
        </Link>
        <Link
          href={user ? "/feed/new" : "/sign-in"}
          className="shrink-0 cursor-pointer rounded-full bg-lime px-4 py-2.5 text-[10.5px] font-bold text-dark transition hover:bg-lime-deep"
        >
          Write a post
        </Link>
      </div>

      {state === "loading" ? (
        <FeedSkeleton />
      ) : state === "error" ? (
        <div className="card mx-4 px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">
            The Exchange is out of reach right now.
          </p>
          <p className="tiny mt-1">Check your connection and try again.</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="card mx-4 px-4 py-8 text-center">
          <p className="text-[12px] font-semibold text-ink">
            {posts.length === 0
              ? "Nothing has been shared here yet."
              : feedTab === "following"
                ? "No posts from people you follow yet."
                : "No popular posts to show yet."}
          </p>
          <p className="tiny mt-1 mx-auto max-w-[36ch]">
            {feedTab === "following"
              ? "Follow people in My Network and their posts will show up here."
              : "The Exchange is where people share useful ideas, work wins and lessons."}
          </p>
          {user && posts.length === 0 ? (
            <p className="mt-4">
              <Link
                href="/feed/new"
                className="cursor-pointer text-[11px] font-bold text-lime-deep hover:underline"
              >
                Write the first post
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {handed.length ? (
            <section aria-label="Shared with you" className="mb-3.5 px-4 xl:hidden">
              <p className="mb-1 text-[9.5px] uppercase tracking-[0.08em] text-faint">
                Shared with you
              </p>
              <ul className="border-t border-line">
                {handed.map((row) => (
                  <li key={row.id} className="border-b border-line">
                    <Link
                      href={`/feed/${row.postId}`}
                      className="flex cursor-pointer items-center gap-2.5 py-2.5"
                    >
                      <Avatar initials={row.fromInitials} src={row.fromAvatarUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-ink">
                          {row.fromName || "Someone"} handed you this post
                        </span>
                        <span className="block truncate text-[10px] text-muted">
                          {row.post.title || row.post.body || row.post.fullName || "from the Exchange"}{" "}
                          · {timeAgo(row.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="divide-y-2 divide-line">
            {shown.map((post) => (
              <PostBlock
                key={post.id}
                post={post}
                liked={liked.has(post.id)}
                likes={counts[post.id] ?? post.likes}
                reshared={reshared.has(post.id)}
                reshares={reshareCounts[post.id] ?? post.reshares}
                signedIn={Boolean(user)}
                followed={post.authorId ? followedIds.has(post.authorId) : false}
                followBusy={post.authorId ? followBusyIds.has(post.authorId) : false}
                onToggleFollow={
                  followStatusReady || !user ? toggleFollowAuthor : undefined
                }
                poll={polls[post.id] ?? null}
                onVote={votePoll}
                onLike={toggleLike}
                onReshare={tapReshare}
                onShare={openShare}
                onOpen={setThread}
                onManage={setOptions}
                edgeToEdge
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-dash px-3.5 py-3 xl:hidden">
            <p
              className={`text-[9.5px] leading-[1.55] text-muted ${
                noteOpen ? "" : "line-clamp-2"
              }`}
            >
              A post is public the moment it is made, so anything you write here can be read by
              anyone using onWard. Your name is shown with your post, to everyone who can read it.
              Your email, settings and your onWards stay private, and deleting a post takes its
              photos, clips and reshares of it with it. Upvotes, comments, reshares and shares need
              a sign-in. Handing a post to someone only adds it to their list of things shared with
              them - the post was already readable here.
            </p>
            <button
              type="button"
              onClick={() => setNoteOpen((open) => !open)}
              className="mt-1 cursor-pointer text-[10px] font-bold text-lime-deep hover:underline"
            >
              {noteOpen ? "Show less" : "Show more"}
            </button>
          </div>
        </>
      )}
      </div>

      <aside className="hidden space-y-3 xl:sticky xl:top-6 xl:block xl:self-start">
        {user ? (
          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="h-16 bg-lime-pale" />
            <div className="px-4 pb-4">
              <Link href="/profile" className="-mt-6 flex w-fit cursor-pointer">
                <Avatar initials={me.initials} src={me.avatarUrl} size="lg" />
              </Link>
              <Link href="/profile" className="mt-2 block cursor-pointer text-[13px] font-bold text-ink hover:underline">
                {me.name || "Your profile"}
              </Link>
              {me.role ? <p className="mt-0.5 text-[10.5px] text-muted">{me.role}</p> : null}
              <Link
                href="/profile"
                className="mt-3 block border-t border-line pt-3 text-[10px] font-semibold text-lime-deep hover:underline"
              >
                View your profile
              </Link>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-line bg-paper p-4">
          <h2 className="text-[11px] font-bold text-ink">Make the Exchange yours</h2>
          <p className="mt-1.5 text-[10px] leading-[1.55] text-muted">
            Share what you know, find your community and keep the conversation going.
          </p>
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <Link href={user ? "/feed/new" : "/sign-in"} className="block cursor-pointer text-[10.5px] font-semibold text-lime-deep hover:underline">
              Write a post
            </Link>
          </div>
        </section>

        {recent.length ? (
          <section aria-label="Your recent Exchange activity" className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="text-[11px] font-bold text-ink">Your recent activity</h2>
            <ul className="mt-2 divide-y divide-line">
              {recent.map(({ item, post }) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setThread(post.id)}
                    className="w-full cursor-pointer py-2 text-left"
                  >
                    <span className="block text-[10px] leading-[1.5] text-inksoft">{interactionLine(item, post)}</span>
                    <span className="mt-0.5 block text-[9px] text-faint">{timeAgo(item.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {handed.length ? (
          <section aria-label="Shared with you" className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="mb-1 text-[11px] font-bold text-ink">Shared with you</h2>
            <ul className="divide-y divide-line">
              {handed.slice(0, 3).map((row) => (
                <li key={row.id}>
                  <Link href={`/feed/${row.postId}`} className="flex cursor-pointer items-start gap-2 py-2.5">
                    <Avatar initials={row.fromInitials} src={row.fromAvatarUrl} />
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold text-ink">{row.fromName || "Someone"} handed you a post</span>
                      <span className="mt-0.5 block line-clamp-2 text-[9px] leading-[1.45] text-muted">
                        {row.post.title || row.post.body || row.post.fullName || "From the Exchange"}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="px-1 text-[9px] leading-[1.55] text-muted">
          Posts are public on the Exchange. Your email, settings and onWards stay private.
        </p>
      </aside>
      </div>
      </div>

      <CommentsSheet
        postId={thread ?? ""}
        open={Boolean(thread)}
        onClose={() => setThread(null)}
        onCountChange={(total) => {
          const id = thread;
          if (!id) return;
          setPosts((prev) =>
            prev.map((post) => (post.id === id ? { ...post, comments: total } : post)),
          );
        }}
      />

      <ExchangeSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />

      <ExchangeShareSheet target={sharing} open={Boolean(sharing)} onClose={() => setSharing(null)} />

      <ReshareSheet
        target={reposting}
        open={Boolean(reposting)}
        onClose={() => setReposting(null)}
        onConfirm={(thought) => void confirmRepost(thought)}
      />

      <PostOptionsSheet
        post={options}
        reshared={options ? reshared.has(options.id) : false}
        open={Boolean(options)}
        onClose={() => setOptions(null)}
        onShare={openShare}
        onReshare={tapReshare}
        onDelete={setPending}
      />

      <Modal open={Boolean(pending)} onClose={() => setPending(null)} title="Delete this post?">
        <p className="text-[11.5px] leading-[1.6] text-inksoft">
          The post, its comments and any files attached to it go away. This cannot be undone.
        </p>
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={() => setPending(null)}
            className="flex-1 cursor-pointer rounded-btn border border-line bg-paper px-4 py-3 text-[13px] font-semibold text-ink transition hover:bg-cream"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={() => pending && void removePost(pending)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-btn bg-ink px-4 py-3 text-[13px] font-semibold text-paper transition hover:brightness-125"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </Modal>
    </PhoneShell>
  );
}
