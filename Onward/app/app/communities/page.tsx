"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Compass, Plus, Search, UsersRound } from "lucide-react";
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

function CommunityRail({
  title,
  communities,
  joiningId,
  onJoin,
  showNext = false,
}: {
  title: string;
  communities: Community[];
  joiningId: string | null;
  onJoin: (community: Community) => void;
  showNext?: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  return (
    <section className="mt-7 min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-ink">{title}</h2>
        {showNext && communities.length > 1 ? (
          <button
            type="button"
            aria-label={`Show more ${title} communities`}
            onClick={() => {
              const rail = railRef.current;
              if (!rail) return;
              rail.scrollBy({ left: rail.clientWidth * 0.8, behavior: "smooth" });
            }}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-cream"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <div
        ref={railRef}
        className="wheel -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0"
      >
        {communities.map((community) => (
          <div key={community.id} className="w-[min(84vw,520px)] shrink-0 snap-start">
            <CommunityCard
              community={community}
              joining={joiningId === community.id}
              onJoin={onJoin}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

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
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[17px] font-bold text-ink">Explore communities by topic</h2>
              <Link
                href="/communities/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lime-deep px-4 text-[10px] font-bold text-white transition hover:bg-ink"
              >
                <Plus className="h-4 w-4" /> Start a community
              </Link>
            </div>
          </header>

          <nav className="flex flex-wrap gap-2" aria-label="Community topics">
            {(["All", ...COMMUNITY_TOPICS] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={topic === item}
                onClick={() => setTopic(item)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2.5 text-[12px] font-medium transition ${
                  topic === item
                    ? "border-lime-deep bg-lime-soft text-ink"
                    : "border-line bg-white text-ink hover:bg-cream"
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

          <label className="mt-5 flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 focus-within:border-lime-deep">
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
          ) : query.trim() || topic !== "All" ? (
            matching.length ? (
              <CommunityRail
                title={query.trim() ? "Search results" : `${topic} communities`}
                communities={matching}
                joiningId={joiningId}
                onJoin={join}
              />
            ) : (
              <div className="mt-7 rounded-[24px] border border-line px-5 py-10 text-center">
                <UsersRound className="mx-auto h-7 w-7 text-lime-deep" />
                <h2 className="mt-2 text-[15px] font-bold text-ink">No communities match that search</h2>
                <p className="mx-auto mt-1 max-w-[38ch] text-[12px] leading-[1.6] text-muted">
                  Try another name or topic, or clear your filters.
                </p>
              </div>
            )
          ) : communities.length ? (
            <>
              <CommunityRail
                title="Recommended for you"
                communities={communities.slice(0, 2)}
                joiningId={joiningId}
                onJoin={join}
              />
              {COMMUNITY_TOPICS.map((communityTopic) => {
                const topicCommunities = communities.filter((community) => community.topic === communityTopic);
                return topicCommunities.length ? (
                  <CommunityRail
                    key={communityTopic}
                    title={communityTopic}
                    communities={topicCommunities}
                    joiningId={joiningId}
                    onJoin={join}
                    showNext
                  />
                ) : null;
              })}
            </>
          ) : (
            <div className="mt-7 rounded-[24px] border border-line px-5 py-10 text-center">
              <UsersRound className="mx-auto h-7 w-7 text-lime-deep" />
              <h2 className="mt-2 text-[15px] font-bold text-ink">Be the first to start one</h2>
              <p className="mx-auto mt-1 max-w-[38ch] text-[10px] leading-[1.6] text-muted">
                Create a space for people to share ideas and move forward together.
              </p>
              <Link
                href="/communities/new"
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-lime px-4 text-[12px] font-bold text-dark hover:bg-lime-deep"
              >
                <Plus className="h-4 w-4" /> Create a community
              </Link>
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
