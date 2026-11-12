"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, Plus, Search, UsersRound } from "lucide-react";
import { useAuth } from "@/components/auth";
import { CommunityCard, CommunityTopicIcon } from "@/components/community-card";
import { PhoneShell } from "@/components/phone-shell";
import { toastError, toastSuccess } from "@/components/toast";
import {
  COMMUNITY_TOPICS,
  fetchCommunities,
  joinCommunity,
  type Community,
} from "@/lib/db";

export default function CommunitiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string>("All");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCommunities(await fetchCommunities());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load communities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  const matching = useMemo(() => {
    const text = query.trim().toLowerCase();
    return communities.filter((community) => {
      const topicMatches = topic === "All" || community.topic === topic;
      const textMatches =
        !text ||
        `${community.name} ${community.description} ${community.topic}`.toLowerCase().includes(text);
      return topicMatches && textMatches;
    });
  }, [communities, query, topic]);

  const join = async (community: Community) => {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    setJoiningId(community.id);
    try {
      await joinCommunity(community.id);
      setCommunities((current) =>
        current.map((item) =>
          item.id === community.id
            ? {
                ...item,
                isMember: true,
                memberCount: item.isMember ? item.memberCount : item.memberCount + 1,
              }
            : item,
        ),
      );
      toastSuccess(`You joined ${community.name}.`);
    } catch (reason) {
      toastError(reason instanceof Error ? reason.message : "Could not join this community.");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <PhoneShell wide whiteBackground>
      <div className="mx-auto grid w-full max-w-[1080px] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_270px]">
        <main className="min-w-0">
          <header className="mb-5">
            <div className="flex items-center gap-3">
              <Link
                href="/today"
                aria-label="Back to home"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-paper"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-[22px] font-bold tracking-tight text-ink sm:text-[25px]">
                Discover communities
              </h1>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-bold text-ink">Explore communities by topic</h2>
                <p className="mt-1 max-w-[55ch] text-[12px] leading-[1.6] text-inksoft">
                  A place to learn together, share progress, and make good things happen.
                </p>
              </div>
              <Link
                href="/communities/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lime-deep px-4 text-[10px] font-bold text-white transition hover:bg-ink"
              >
                <Plus className="h-4 w-4" /> Start a community
              </Link>
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lime-pale px-3 text-[10px] font-semibold text-inksoft">
                <UsersRound className="h-3.5 w-3.5" /> Public communities
              </span>
            </div>
          </header>

          <label className="mb-4 flex h-11 items-center gap-2 rounded-full border border-line bg-paper px-4 focus-within:border-lime-deep">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search communities"
              aria-label="Search communities"
              className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
            />
          </label>

          <div className="mb-5 wheel overflow-x-auto">
            <nav
              className="grid w-max grid-flow-row grid-cols-[repeat(6,max-content)] grid-rows-2 gap-2"
              aria-label="Community topics"
            >
              {(["All", ...COMMUNITY_TOPICS] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={topic === item}
                  onClick={() => setTopic(item)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] font-semibold transition ${
                    topic === item
                      ? "bg-ink text-white"
                      : "bg-paper text-muted hover:bg-lime-pale hover:text-ink"
                  }`}
                >
                  {item === "All" ? (
                    <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <CommunityTopicIcon topic={item} />
                  )}
                  {item}
                </button>
              ))}
            </nav>
          </div>

          {error ? (
            <div className="card px-5 py-8 text-center">
              <p role="alert" className="text-[11px] text-danger">{error}</p>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="mt-3 cursor-pointer text-[10px] font-bold text-lime-deep hover:underline"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="card h-40 animate-pulse bg-paper" />
              ))}
            </div>
          ) : matching.length ? (
            <>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-lime-deep">
                    {topic === "All" ? "Made for shared progress" : topic}
                  </p>
                  <h2 className="mt-1 text-[16px] font-bold text-ink">
                    {query.trim()
                      ? "Search results"
                      : topic === "All"
                        ? "Explore communities"
                        : `${topic} communities`}
                  </h2>
                </div>
                <span className="text-[10px] text-muted">{matching.length} found</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {matching.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    joining={joiningId === community.id}
                    onJoin={join}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="card px-5 py-10 text-center">
              <UsersRound className="mx-auto h-7 w-7 text-lime-deep" />
              <h2 className="mt-2 text-[14px] font-bold text-ink">
                {communities.length ? "No communities match that search" : "Be the first to start one"}
              </h2>
              <p className="mx-auto mt-1 max-w-[38ch] text-[10px] leading-[1.6] text-muted">
                {communities.length
                  ? "Try another name or topic, or clear your filters."
                  : "Create a space for people to share ideas and move forward together."}
              </p>
              {!communities.length ? (
                <Link
                  href="/communities/new"
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-lime-deep px-4 text-[10px] font-bold text-white hover:bg-ink"
                >
                  <Plus className="h-4 w-4" /> Create a community
                </Link>
              ) : null}
            </div>
          )}
        </main>

        <aside className="hidden space-y-4 lg:block">
          <section className="card p-4">
            <h2 className="text-[12px] font-bold text-ink">A good community starts small</h2>
            <p className="mt-2 text-[10px] leading-[1.65] text-muted">
              Pick a clear topic, welcome new members, and share something useful to get the
              conversation going.
            </p>
            <Link
              href="/communities/new"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-lime-deep hover:underline"
            >
              Create your own <Plus className="h-3.5 w-3.5" />
            </Link>
          </section>
          <section className="card p-4">
            <h2 className="text-[11px] font-bold text-ink">Community guidelines</h2>
            <ul className="mt-2 space-y-2 text-[9.5px] leading-[1.5] text-muted">
              <li>Be generous with what you know.</li>
              <li>Keep the conversation respectful.</li>
              <li>Make space for different perspectives.</li>
            </ul>
          </section>
        </aside>
      </div>
    </PhoneShell>
  );
}
