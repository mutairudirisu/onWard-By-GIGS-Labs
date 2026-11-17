"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { Avatar } from "@/components/feed-post";
import { PhoneShell } from "@/components/phone-shell";
import { toastError, toastSuccess } from "@/components/toast";
import { TextInput } from "@/components/ui";
import {
  fetchConnectionPosts,
  fetchNetworkCatchupEvents,
  fetchNetworkCatchupSince,
  fetchNetworkConnections,
  fetchNetworkRequests,
  fetchNetworkSuggestions,
  markNetworkCatchupSeen,
  respondToConnectionRequest,
  searchPeople,
  sendConnectionRequest,
  type ExchangePerson,
  type FeedPost,
  type NetworkEvent,
  type NetworkRequest,
  type NetworkSuggestion,
} from "@/lib/db";
import {
  ArrowRight,
  Cake,
  Check,
  Loader2,
  MessageCircle,
  Search,
  Star,
  UsersRound,
  X,
} from "lucide-react";

type NetworkTab = "grow" | "catchup";
type CatchupFilter = "all" | "posts" | "birthdays" | "job_change" | "work_anniversary";

const CATCHUP_FILTERS: { id: CatchupFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "posts", label: "Posts" },
  { id: "birthdays", label: "Birthdays" },
  { id: "job_change", label: "Job changes" },
  { id: "work_anniversary", label: "Work anniversaries" },
];

function CatchupEventCard({ event }: { event: NetworkEvent }) {
  const date = new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const description =
    event.type === "birthday"
      ? "has a birthday"
      : event.type === "work_anniversary"
        ? `celebrates ${event.years} ${event.years === 1 ? "year" : "years"} at ${event.organization}`
        : `started a new role${event.organization ? ` at ${event.organization}` : ""}`;
  const href = `/messages/new?to=${encodeURIComponent(event.userId)}`;

  return (
    <article className="flex items-start gap-3 border-b border-line px-6 py-4 last:border-b-0">
      <Link href={`/people/${event.userId}`} aria-label={`View ${event.fullName}'s profile`}>
        <Avatar initials={event.initials} src={event.avatarUrl} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-[1.55] text-ink">
          <Link href={`/people/${event.userId}`} className="font-bold hover:underline">
            {event.fullName || "Someone in your network"}
          </Link>{" "}
          {description}
        </p>
        {event.role && event.type === "job_change" ? (
          <p className="mt-1 text-[11px] text-muted">{event.role}</p>
        ) : null}
        <p className="mt-1 text-[10px] text-faint">{date}</p>
      </div>
      <Link
        href={href}
        className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-line px-2.5 text-[10px] font-semibold text-inksoft transition hover:bg-cream"
      >
        <MessageCircle className="h-3 w-3" />
        Say hello
      </Link>
    </article>
  );
}

function PostCatchupCard({ post }: { post: FeedPost }) {
  const [expanded, setExpanded] = useState(false);
  const isLongPost = (post.body?.length ?? 0) > 240;
  const canComment = post.canComment !== false;

  return (
    <article className="border-b border-line px-6 py-4 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <Link href={post.authorId ? `/people/${post.authorId}` : "/network"}>
          <Avatar initials={post.initials} src={post.avatarUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={post.authorId ? `/people/${post.authorId}` : "/network"}
            className="block truncate text-[12px] font-bold text-ink hover:underline"
          >
            {post.fullName || "Someone in your network"}
          </Link>
          <p className="truncate text-[10px] text-muted">
            {post.role || "onWard member"} ·{" "}
            {new Date(post.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      {post.title ? <h3 className="mt-3 text-[13px] font-bold text-ink">{post.title}</h3> : null}
      {post.body ? (
        <p
          className={`mt-1 whitespace-pre-wrap text-[11px] leading-[1.6] text-inksoft ${
            isLongPost && !expanded ? "line-clamp-4" : ""
          }`}
        >
          {post.body}
        </p>
      ) : null}
      {isLongPost ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="mt-1 text-[10px] font-semibold text-lime-deep hover:underline"
        >
          {expanded ? "See less" : "See more"}
        </button>
      ) : null}
      <Link
        href={
          canComment
            ? `/feed/${post.id}?focus=comments#comments`
            : `/feed/${post.id}`
        }
        className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-lime-deep hover:underline"
      >
        {canComment ? "Comment" : "Open post"} <ArrowRight className="h-3 w-3" />
      </Link>
    </article>
  );
}

function PersonCard({
  person,
  reason,
  requested,
  busy,
  onConnect,
}: {
  person: ExchangePerson;
  reason: string;
  requested: boolean;
  busy: boolean;
  onConnect: () => void;
}) {
  return (
    <article className="flex min-w-0 items-center gap-3 border-b border-line px-6 py-3 last:border-b-0">
      <Link href={`/people/${person.id}`} aria-label={`View ${person.name}'s profile`}>
        <Avatar initials={person.initials} src={person.avatarUrl} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/people/${person.id}`} className="block truncate text-[12px] font-bold text-ink hover:underline">
          {person.name || "onWard member"}
        </Link>
        <p className="truncate text-[10px] text-muted">{person.role || "onWard member"}</p>
        <p className="mt-0.5 truncate text-[9px] font-medium text-lime-deep">{reason}</p>
      </div>
      <button
        type="button"
        onClick={onConnect}
        disabled={busy || requested}
        className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-lime-deep px-2.5 text-[10px] font-bold text-lime-deep transition hover:bg-lime-pale disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : requested ? "Requested" : "Connect"}
      </button>
    </article>
  );
}

function RequestCard({
  request,
  busy,
  onRespond,
}: {
  request: NetworkRequest;
  busy: boolean;
  onRespond: (accept: boolean) => void;
}) {
  return (
    <article className="flex items-center gap-3 border-b border-line px-6 py-3 last:border-b-0">
      <Link href={`/people/${request.person.id}`}>
        <Avatar initials={request.person.initials} src={request.person.avatarUrl} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/people/${request.person.id}`} className="block truncate text-[12px] font-bold text-ink hover:underline">
          {request.person.name || "onWard member"}
        </Link>
        <p className="truncate text-[10px] text-muted">{request.person.role || "Connection request"}</p>
      </div>
      {request.direction === "incoming" ? (
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => onRespond(true)}
            aria-label={`Accept ${request.person.name}'s request`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-dark disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRespond(false)}
            aria-label={`Decline ${request.person.name}'s request`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <span className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-semibold text-muted">
          Pending
        </span>
      )}
    </article>
  );
}

export default function NetworkPage() {
  const { user, profile, ready } = useAuth();
  const handledAcceptRequest = useRef<string | null>(null);
  const [tab, setTab] = useState<NetworkTab>("grow");
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [suggestions, setSuggestions] = useState<NetworkSuggestion[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [loadingGrow, setLoadingGrow] = useState(true);
  const [growError, setGrowError] = useState("");
  const [growRetry, setGrowRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExchangePerson[]>([]);
  const [searching, setSearching] = useState(false);
  const [catchupFilter, setCatchupFilter] = useState<CatchupFilter>("all");
  const [catchupPosts, setCatchupPosts] = useState<FeedPost[]>([]);
  const [catchupEvents, setCatchupEvents] = useState<NetworkEvent[]>([]);
  const [loadingCatchup, setLoadingCatchup] = useState(false);
  const [catchupError, setCatchupError] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    const url = new URL(window.location.href);
    const requestId = url.searchParams.get("acceptRequest");
    if (!requestId || handledAcceptRequest.current === requestId) return;

    handledAcceptRequest.current = requestId;
    url.searchParams.delete("acceptRequest");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);

    void respondToConnectionRequest(requestId, true)
      .then(() => {
        toastSuccess("Connection request accepted.");
        setGrowRetry((attempt) => attempt + 1);
      })
      .catch((error: unknown) => {
        toastError(error instanceof Error ? error.message : "Couldn't accept the connection request.");
      });
  }, [ready, user]);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    setLoadingGrow(true);
    setGrowError("");
    void Promise.all([
      fetchNetworkRequests(),
      fetchNetworkSuggestions(),
      fetchNetworkConnections(),
    ])
      .then(([nextRequests, nextSuggestions, connections]) => {
        if (cancelled) return;
        setRequests(nextRequests);
        setSuggestions(nextSuggestions);
        setConnectionCount(connections.length);
        setRequestedIds(
          new Set(
            nextRequests
              .filter((request) => request.direction === "outgoing")
              .map((request) => request.person.id),
          ),
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Couldn't load your network.";
          setGrowError(
            message.toLowerCase().includes("schema cache")
              ? "The Network database functions are not refreshed yet. Apply the latest Supabase migration, then try again."
              : message,
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingGrow(false);
      });
    return () => {
      cancelled = true;
    };
  }, [growRetry, ready, user]);

  useEffect(() => {
    const term = query.trim();
    if (!user || !term) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void searchPeople(term)
        .then((people) => {
          if (!cancelled) setSearchResults(people);
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            toastError(error instanceof Error ? error.message : "Couldn't search people.");
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, user]);

  useEffect(() => {
    if (tab !== "catchup" || !user) return;
    let cancelled = false;
    setLoadingCatchup(true);
    setCatchupError("");
    void (async () => {
      try {
        const [since, connections] = await Promise.all([
          fetchNetworkCatchupSince(),
          fetchNetworkConnections(),
        ]);
        const ids = connections.map((person) => person.id);
        const [posts, events] = await Promise.all([
          fetchConnectionPosts(ids, since),
          fetchNetworkCatchupEvents(since),
        ]);
        if (cancelled) return;
        setCatchupPosts(posts);
        setCatchupEvents(events);
        await markNetworkCatchupSeen();
      } catch (error) {
        if (!cancelled) {
          setCatchupError(error instanceof Error ? error.message : "Couldn't load Catch up.");
        }
      } finally {
        if (!cancelled) setLoadingCatchup(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, user]);

  const incomingRequests = requests.filter((request) => request.direction === "incoming");
  const filteredEvents = catchupEvents.filter((event) => {
    if (catchupFilter === "all") return true;
    if (catchupFilter === "birthdays") return event.type === "birthday";
    if (catchupFilter === "posts") return false;
    return event.type === catchupFilter;
  });
  const visiblePosts = catchupFilter === "all" || catchupFilter === "posts" ? catchupPosts : [];
  const catchupItems = useMemo(
    () => [
      ...visiblePosts.map((post) => ({
        key: `post:${post.id}`,
        time: Date.parse(post.createdAt),
        post,
        event: null as NetworkEvent | null,
      })),
      ...filteredEvents.map((event) => ({
        key: `event:${event.id}`,
        time: Date.parse(`${event.date}T00:00:00`),
        post: null as FeedPost | null,
        event,
      })),
    ].sort((a, b) => b.time - a.time),
    [filteredEvents, visiblePosts],
  );

  async function connect(person: ExchangePerson) {
    if (busyIds.has(person.id)) return;
    setBusyIds((ids) => new Set(ids).add(person.id));
    try {
      await sendConnectionRequest(person.id);
      setRequestedIds((ids) => new Set(ids).add(person.id));
      setSuggestions((people) => people.filter((candidate) => candidate.id !== person.id));
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't send the connection request.");
    } finally {
      setBusyIds((ids) => {
        const next = new Set(ids);
        next.delete(person.id);
        return next;
      });
    }
  }

  async function respond(request: NetworkRequest, accept: boolean) {
    if (busyIds.has(request.requestId)) return;
    setBusyIds((ids) => new Set(ids).add(request.requestId));
    try {
      await respondToConnectionRequest(request.requestId, accept);
      setRequests((current) => current.filter((entry) => entry.requestId !== request.requestId));
      if (accept) setConnectionCount((count) => count + 1);
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Couldn't update the connection request.");
    } finally {
      setBusyIds((ids) => {
        const next = new Set(ids);
        next.delete(request.requestId);
        return next;
      });
    }
  }

  if (!ready || !user) {
    return (
      <PhoneShell tab="network">
        <div className="card px-4 py-8 text-center">
          <UsersRound className="mx-auto h-6 w-6 text-lime-deep" />
          <h1 className="mt-2 text-[14px] font-bold text-ink">My Network</h1>
          <p className="mt-1 text-[12px] text-muted">Sign in to grow your network.</p>
          <Link href="/sign-in" className="mt-4 inline-flex items-center gap-1 rounded-full bg-lime px-4 py-2 text-[12px] font-bold text-dark">
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell tab="network" wide>
      <header className="relative z-10 mb-5 flex items-center gap-2.5">
        <Link href="/profile" aria-label="Your profile">
          <Avatar
            initials={profile?.initials ?? user.email?.slice(0, 2).toUpperCase() ?? "ME"}
            src={profile?.avatarUrl}
            size="sm"
          />
        </Link>
        <div className="relative min-w-0 flex-1">
          <div className="flex h-10 items-center gap-2 rounded-full border border-line bg-paper px-3 text-muted focus-within:border-lime-deep">
            <Search className="h-4 w-4 shrink-0" />
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people"
              aria-label="Search people"
              className="h-full min-w-0 border-0 bg-transparent px-0 py-0 text-[12px] focus:border-0 focus:ring-0"
            />
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          </div>
          {query.trim() ? (
            <div className="absolute inset-x-0 top-12 z-30 overflow-hidden rounded-xl border border-line bg-paper shadow-lift">
              {searchResults.length ? searchResults.slice(0, 6).map((person) => (
                <Link
                  key={person.id}
                  href={`/people/${person.id}`}
                  onClick={() => setQuery("")}
                  className="flex items-center gap-2.5 border-b border-line px-3 py-2.5 last:border-0 hover:bg-cream"
                >
                  <Avatar initials={person.initials} src={person.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-ink">{person.name}</span>
                    <span className="block truncate text-[10px] text-muted">{person.role || "onWard member"}</span>
                  </span>
                </Link>
              )) : (
                <p className="px-3 py-4 text-center text-[11px] text-muted">
                  {searching ? "Searching…" : "No people found."}
                </p>
              )}
            </div>
          ) : null}
        </div>
        <Link
          href="/messages"
          aria-label="Open messages"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:bg-cream"
        >
          <MessageCircle className="h-[18px] w-[18px]" />
        </Link>
      </header>

      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-ink">My Network</h1>
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-dashed border-lime-deep/50 bg-lime-pale px-3 py-1 text-[11px] font-semibold text-lime-deep">
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
            <span>{connectionCount} {connectionCount === 1 ? "connection" : "connections"}</span>
            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
          </div>
        </div>
      </div>

      <nav
        className="-mx-5 grid grid-cols-2 border-b border-line px-3 md:mx-0 md:px-0"
        aria-label="My Network"
      >
        {(["grow", "catchup"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            aria-current={tab === item ? "page" : undefined}
            className={`cursor-pointer border-b-2 px-2 py-2.5 text-[12px] font-semibold transition ${
              tab === item
                ? "border-lime-deep text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {item === "grow" ? "Grow" : "Catch up"}
          </button>
        ))}
      </nav>

      <Link
        href="/network/invitations"
        className="-mx-5 mb-5 flex min-h-10 items-center justify-between border-b border-line px-3 text-[12px] font-medium text-ink transition hover:bg-paper/50 md:mx-0"
      >
        Invitations <ArrowRight className="h-4 w-4 text-muted" />
      </Link>

      {tab === "grow" ? (
        <div className="space-y-5">
          {growError ? (
            <div className="-mx-5 flex items-center justify-between gap-3 border-y border-line px-5 py-4 text-[11px] text-red-700 md:mx-0">
              <span>{growError}</span>
              <button
                type="button"
                onClick={() => setGrowRetry((attempt) => attempt + 1)}
                className="shrink-0 font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : null}
          <section className="-mx-5 md:mx-0">
            <header className="flex items-center justify-between border-b border-line px-5 py-3">
              <div>
                <h2 className="text-[13px] font-bold text-ink">Connection requests</h2>
                <p className="mt-0.5 text-[10px] text-muted">Accept or decline invitations to connect.</p>
              </div>
              <Link href="/network/invitations" className="text-[10px] font-semibold text-lime-deep">
                View all
              </Link>
            </header>
            {loadingGrow ? (
              <p className="border-b border-line px-5 py-5 text-center text-[11px] text-muted">Loading requests…</p>
            ) : incomingRequests.length ? (
              incomingRequests.slice(0, 4).map((request) => (
                <RequestCard
                  key={request.requestId}
                  request={request}
                  busy={busyIds.has(request.requestId)}
                  onRespond={(accept) => void respond(request, accept)}
                />
              ))
            ) : (
              <p className="border-b border-line px-5 py-5 text-center text-[11px] text-muted">No new connection requests.</p>
            )}
          </section>

          <section className="-mx-5 md:mx-0">
            <header className="flex items-center gap-2.5 border-b border-line px-5 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-pale text-lime-deep">
                <UsersRound className="h-4 w-4" />
              </span>
              <span>
                <h2 className="text-[13px] font-bold text-ink">People you may know</h2>
                <p className="mt-0.5 text-[10px] text-muted">Based on your school, role and shared connections.</p>
              </span>
            </header>
            {loadingGrow ? (
              <p className="border-b border-line px-5 py-5 text-center text-[11px] text-muted">Finding people…</p>
            ) : suggestions.length ? (
              <div>
                {suggestions.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    reason={person.reason}
                    requested={requestedIds.has(person.id)}
                    busy={busyIds.has(person.id)}
                    onConnect={() => void connect(person)}
                  />
                ))}
              </div>
            ) : (
              <div className="border-b border-line px-5 py-6 text-center">
                <p className="text-[11px] text-muted">No suggestions yet. Add your school or role to your profile to get better matches.</p>
                <Link href="/profile/edit" className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-lime-deep">
                  Update profile <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div>
          <section className="-mx-5 md:mx-0">
            <h2 className="sr-only">Catch up with your connections</h2>
            <div className="wheel flex gap-1.5 overflow-x-auto border-b border-line px-3 py-2">
              {CATCHUP_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setCatchupFilter(filter.id)}
                  aria-pressed={catchupFilter === filter.id}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                    catchupFilter === filter.id
                      ? "bg-lime text-dark"
                      : "border border-line text-muted hover:bg-cream"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {catchupError ? (
              <p className="px-4 py-5 text-center text-[11px] text-red-700">{catchupError}</p>
            ) : loadingCatchup ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-[11px] text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading Catch up…
              </div>
            ) : catchupItems.length ? (
              catchupItems.map((item) =>
                item.post ? (
                  <PostCatchupCard key={item.key} post={item.post} />
                ) : item.event ? (
                  <CatchupEventCard key={item.key} event={item.event} />
                ) : null,
              )
            ) : (
              <div className="px-4 py-9 text-center">
                {catchupFilter === "birthdays" ? (
                  <Cake className="mx-auto h-5 w-5 text-lime-deep" />
                ) : (
                  <UsersRound className="mx-auto h-5 w-5 text-lime-deep" />
                )}
                <p className="mt-2 text-[11px] font-semibold text-ink">You’re all caught up</p>
                <p className="mt-1 text-[10px] text-muted">New connection posts and milestones will show here.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </PhoneShell>
  );
}
