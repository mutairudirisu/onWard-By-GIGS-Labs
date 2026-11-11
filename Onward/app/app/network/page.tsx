"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { Avatar } from "@/components/feed-post";
import { PhoneShell } from "@/components/phone-shell";
import { toastError } from "@/components/toast";
import {
  fetchFollowList,
  followPerson,
  searchPeople,
  unfollowPerson,
  type ExchangePerson,
} from "@/lib/db";
import { ArrowRight, Loader2, Search, Sparkles, UserCheck, UserPlus, UsersRound } from "lucide-react";

type NetworkTab = "discover" | "following" | "followers";

const TABS: { id: NetworkTab; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "following", label: "Following" },
  { id: "followers", label: "Followers" },
];

export default function NetworkPage() {
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<NetworkTab>("discover");
  const [following, setFollowing] = useState<ExchangePerson[]>([]);
  const [followers, setFollowers] = useState<ExchangePerson[]>([]);
  const [discoverable, setDiscoverable] = useState<ExchangePerson[]>([]);
  const [query, setQuery] = useState("");
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const followedIds = useMemo(() => new Set(following.map((person) => person.id)), [following]);

  const loadLists = useCallback(async () => {
    if (!user) return;
    setLoadingLists(true);
    setLoadError(null);
    try {
      const [nextFollowing, nextFollowers] = await Promise.all([
        fetchFollowList(user.id, "following"),
        fetchFollowList(user.id, "followers"),
      ]);
      setFollowing(nextFollowing);
      setFollowers(nextFollowers);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Couldn't load your network.");
    } finally {
      setLoadingLists(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setLoadingLists(false);
      setLoadingPeople(false);
      return;
    }
    void loadLists();
  }, [loadLists, ready, user]);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    setLoadingPeople(true);
    setPeopleError(null);
    const timer = window.setTimeout(() => {
      void searchPeople(query.trim())
        .then((people) => {
          if (!cancelled) setDiscoverable(people);
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setDiscoverable([]);
            setPeopleError(error instanceof Error ? error.message : "Couldn't find people.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingPeople(false);
        });
    }, query.trim() ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, ready, searchAttempt, user]);

  const toggleFollow = useCallback(
    async (person: ExchangePerson) => {
      if (busyIds.has(person.id)) return;
      const alreadyFollowing = followedIds.has(person.id);
      setBusyIds((current) => new Set(current).add(person.id));
      try {
        if (alreadyFollowing) {
          await unfollowPerson(person.id);
          setFollowing((current) => current.filter((entry) => entry.id !== person.id));
        } else {
          await followPerson(person.id);
          setFollowing((current) =>
            current.some((entry) => entry.id === person.id) ? current : [person, ...current],
          );
        }
      } catch (error) {
        toastError(
          error instanceof Error
            ? error.message
            : alreadyFollowing
              ? "Couldn't unfollow this person."
              : "Couldn't follow this person.",
        );
      } finally {
        setBusyIds((current) => {
          const next = new Set(current);
          next.delete(person.id);
          return next;
        });
      }
    },
    [busyIds, followedIds],
  );

  const visiblePeople =
    tab === "following"
      ? following
      : tab === "followers"
        ? followers
        : discoverable;

  if (!ready || !user) {
    return (
      <PhoneShell tab="feed">
        <div className="card px-4 py-8 text-center">
          <UsersRound className="mx-auto h-6 w-6 text-lime-deep" />
          <h1 className="mt-2 text-[14px] font-bold text-ink">My Network</h1>
          <p className="mt-1 text-[11px] text-muted">Sign in to find and follow people.</p>
          <Link
            href="/sign-in"
            className="mt-4 inline-flex cursor-pointer items-center gap-1 rounded-full bg-lime px-4 py-2 text-[11px] font-bold text-dark hover:bg-lime-deep"
          >
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell tab="feed" wide>
      <div className="mx-auto grid w-full max-w-[920px] items-start gap-6 lg:grid-cols-[minmax(0,620px)_minmax(220px,260px)]">
        <main className="min-w-0">
          <header className="mb-5 overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="relative overflow-hidden bg-lime-pale px-5 pb-5 pt-6 sm:px-7">
              <span className="pointer-events-none absolute -right-4 -top-8 h-36 w-36 rounded-full border-[18px] border-lime/20" />
              <span className="pointer-events-none absolute right-20 top-12 h-12 w-12 rounded-full bg-lime/25" />
              <div className="relative flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-lime-deep">
                <UsersRound className="h-4 w-4" /> Your people
              </div>
              <h1 className="relative mt-2 text-[24px] font-bold tracking-tight text-ink sm:text-[28px]">
                My Network
              </h1>
              <p className="relative mt-1 max-w-[54ch] text-[11px] leading-[1.6] text-inksoft">
                Find people sharing what they know and doing work worth learning from. Following is
                one-way, so you choose whose updates to keep up with.
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-line border-t border-line">
              <button
                type="button"
                onClick={() => setTab("following")}
                className="cursor-pointer px-4 py-3 text-left transition hover:bg-cream"
              >
                <span className="block text-[17px] font-bold tabular-nums text-ink">
                  {loadingLists ? "—" : following.length}
                </span>
                <span className="text-[9.5px] font-semibold text-muted">Following</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("followers")}
                className="cursor-pointer px-4 py-3 text-left transition hover:bg-cream"
              >
                <span className="block text-[17px] font-bold tabular-nums text-ink">
                  {loadingLists ? "—" : followers.length}
                </span>
                <span className="text-[9.5px] font-semibold text-muted">Followers</span>
              </button>
            </div>
          </header>

          <section className="overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="border-b border-line px-4 pt-3">
              <nav className="flex gap-5" aria-label="Network sections">
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    aria-current={tab === item.id ? "page" : undefined}
                    className={`cursor-pointer border-b-2 px-0.5 pb-2.5 text-[11px] font-semibold transition ${
                      tab === item.id
                        ? "border-lime-deep text-ink"
                        : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {tab === "discover" ? (
              <label className="mx-4 mt-4 flex h-10 items-center gap-2 rounded-full border border-line bg-cream px-3 focus-within:border-lime-deep">
                <Search className="h-4 w-4 shrink-0 text-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search people by name"
                  aria-label="Search people by name"
                  className="min-w-0 flex-1 bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
                />
              </label>
            ) : null}

            {loadError ? (
              <div className="px-4 py-6 text-center">
                <p role="alert" className="text-[11px] text-muted">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadLists()}
                  className="mt-2 cursor-pointer text-[10px] font-bold text-lime-deep hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : tab === "discover" && peopleError ? (
              <div className="px-4 py-6 text-center">
                <p role="alert" className="text-[11px] text-muted">{peopleError}</p>
                <button
                  type="button"
                  onClick={() => setSearchAttempt((attempt) => attempt + 1)}
                  className="mt-2 cursor-pointer text-[10px] font-bold text-lime-deep hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (tab === "discover" ? loadingPeople : loadingLists) ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-[11px] text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading people…
              </div>
            ) : visiblePeople.length ? (
              <ul className="mt-3 divide-y divide-line">
                {visiblePeople.map((person) => {
                  const isFollowing = followedIds.has(person.id);
                  const busy = busyIds.has(person.id);
                  const actionAvailable = tab !== "following" || isFollowing;
                  return (
                    <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                      <Link
                        href={`/people/${person.id}`}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                      >
                        <Avatar initials={person.initials} src={person.avatarUrl} size="md" />
                        <span className="min-w-0">
                          <span className="block truncate text-[11.5px] font-bold text-ink">
                            {person.name || "Someone"}
                          </span>
                          {person.role ? (
                            <span className="mt-0.5 block truncate text-[10px] text-muted">
                              {person.role}
                            </span>
                          ) : (
                            <span className="mt-0.5 block text-[9px] text-faint">
                              onWard member
                            </span>
                          )}
                        </span>
                      </Link>
                      {actionAvailable ? (
                        <button
                          type="button"
                          onClick={() => void toggleFollow(person)}
                          disabled={busy}
                          aria-pressed={isFollowing}
                          className={`flex h-8 min-w-[92px] cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-[10px] font-bold transition disabled:cursor-wait disabled:opacity-60 ${
                            isFollowing
                              ? "border border-line bg-paper text-ink hover:border-danger/30 hover:bg-danger/5 hover:text-danger"
                              : "bg-lime text-dark hover:bg-lime-deep"
                          }`}
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isFollowing ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              {tab === "following" ? "Unfollow" : "Following"}
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3.5 w-3.5" />
                              Follow
                            </>
                          )}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-5 py-10 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-lime-pale text-lime-deep">
                  {tab === "discover" ? (
                    <Search className="h-5 w-5" />
                  ) : (
                    <UsersRound className="h-5 w-5" />
                  )}
                </span>
                <p className="mt-2 text-[11.5px] font-bold text-ink">
                  {tab === "discover"
                    ? query.trim()
                      ? "No people found"
                      : "No people to discover yet"
                    : tab === "following"
                      ? "You’re not following anyone yet"
                      : "You don’t have followers yet"}
                </p>
                <p className="mx-auto mt-1 max-w-[38ch] text-[10px] leading-[1.5] text-muted">
                  {tab === "discover"
                    ? "Try another name, or explore a channel to find people sharing your interests."
                    : tab === "following"
                      ? "Discover people in the Exchange and follow the voices you want to hear from."
                      : "Keep sharing your work and ideas in the Exchange to help others find you."}
                </p>
                {tab !== "discover" ? (
                  <button
                    type="button"
                    onClick={() => setTab("discover")}
                    className="mt-3 cursor-pointer text-[10px] font-bold text-lime-deep hover:underline"
                  >
                    Discover people
                  </button>
                ) : (
                  <Link
                    href="/channels"
                    className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[10px] font-bold text-lime-deep hover:underline"
                  >
                    Explore channels <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}
          </section>
          <p className="mt-3 text-center text-[9px] leading-[1.5] text-faint lg:text-left">
            Following is one-way. People can see public Exchange posts whether or not you follow
            them.
          </p>
        </main>

        <aside className="hidden space-y-3 lg:sticky lg:top-6 lg:block">
          <section className="rounded-2xl border border-line bg-paper p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-pale text-lime-deep">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="mt-3 text-[12px] font-bold text-ink">Grow your circle</h2>
            <p className="mt-1.5 text-[10px] leading-[1.6] text-muted">
              Follow people whose experience, skills or ideas you want to keep up with. Their
              public posts are still open to everyone.
            </p>
          </section>
          <section className="rounded-2xl border border-line bg-paper p-4">
            <h2 className="text-[11px] font-bold text-ink">Looking for a shared interest?</h2>
            <p className="mt-1.5 text-[10px] leading-[1.55] text-muted">
              Channels bring people together around a place, craft or topic.
            </p>
            <Link
              href="/channels"
              className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[10px] font-bold text-lime-deep hover:underline"
            >
              Explore channels <ArrowRight className="h-3 w-3" />
            </Link>
          </section>
        </aside>
      </div>
    </PhoneShell>
  );
}
