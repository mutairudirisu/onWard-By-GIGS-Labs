"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Compass, Plus, Search, UsersRound } from "lucide-react";
import { useAuth } from "@/components/auth";
import { CommunityCard, CommunityTopicIcon } from "@/components/community-card";
import { PhoneShell } from "@/components/phone-shell";
import { toastError, toastSuccess } from "@/components/toast";
import {
  COMMUNITY_TOPICS,
  fetchCommunities,
  joinCommunity,
  type Community,
  type CommunityTopic,
} from "@/lib/db";

const COMMUNITIES_VISIBLE_BY_DEFAULT = 4;

const COMMUNITY_PREVIEW_GROUPS = [
  {
    topic: "Technology",
    names: [
      "Frontend Builders",
      "AI Study Circle",
      "Data Explorers",
      "Cloud Native Crew",
      "Design Systems Lab",
      "Open Source Makers",
      "Mobile Dev Meetup",
      "Robotics & IoT",
      "Cyber Safety Circle",
      "Indie Hackers",
    ],
  },
  {
    topic: "Business",
    names: [
      "Startup Founders",
      "Small Business Circle",
      "Brand Builders",
      "Product People",
      "Freelancers Network",
      "Growth & Marketing",
      "Women in Business",
      "Finance for Creators",
      "E-commerce Operators",
      "Career to Founder",
    ],
  },
  {
    topic: "Education & Career",
    names: [
      "Study Together",
      "Career Switchers",
      "Job Search Support",
      "Scholarship Hunters",
      "Academic Writing",
      "Interview Practice",
      "Early Career Circle",
      "Learning Spanish",
      "Remote Work Skills",
      "Graduate Mentors",
    ],
  },
  {
    topic: "Wellness",
    names: [
      "Mindful Mornings",
      "Walking Club",
      "Healthy Habits",
      "Sleep Better Circle",
      "Stress Less",
      "Nutrition Notes",
      "Yoga at Home",
      "Mental Wellness",
      "Fitness Beginners",
      "Balance & Boundaries",
    ],
  },
  {
    topic: "Arts & Design",
    names: [
      "Sketchbook Society",
      "Graphic Design Circle",
      "Creative Writers",
      "Photo Walks",
      "Illustrators Corner",
      "DIY Makers",
      "Motion Design",
      "Music Makers",
      "Interior Ideas",
      "Craft & Crochet",
    ],
  },
] satisfies { topic: CommunityTopic; names: string[] }[];

function createPreviewCommunities(): Community[] {
  return COMMUNITY_PREVIEW_GROUPS.flatMap(({ topic, names }, topicIndex) =>
    names.map((name, index) => {
      const slug = `preview-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      return {
        id: slug,
        slug,
        name,
        avatarPath: null,
        bannerPath: null,
        topic,
        communityType: "public",
        isMature: false,
        description: `A friendly place to share ideas and progress in ${name.toLowerCase()}.`,
        createdAt: "2026-01-01T00:00:00.000Z",
        memberCount: 18 + topicIndex * 5 + index * 7,
        postCount: 2 + topicIndex + index * 3,
        isMember: false,
        isOwner: false,
      };
    }),
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
  const [topic, setTopic] = useState<CommunityTopic | "All">("All");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [previewAvailable, setPreviewAvailable] = useState(false);
  const [previewMode, setPreviewMode] = useState<boolean | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<CommunityTopic[]>([]);

  useEffect(() => {
    const isLocalDevelopment =
      process.env.NODE_ENV === "development" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const enablePreview =
      isLocalDevelopment &&
      new URLSearchParams(window.location.search).get("previewCommunities") === "1";
    setPreviewAvailable(isLocalDevelopment);
    setPreviewMode(enablePreview);
  }, []);

  const load = useCallback(async () => {
    if (previewMode === null) return;
    setLoading(true);
    setError("");
    try {
      setCommunities(previewMode ? createPreviewCommunities() : await fetchCommunities());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load communities.");
    } finally {
      setLoading(false);
    }
  }, [previewMode]);

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

  const groupedCommunities = useMemo(() => {
    const topics = topic === "All" ? COMMUNITY_TOPICS : [topic];
    return topics
      .map((groupTopic) => ({
        topic: groupTopic,
        communities: matching.filter((community) => community.topic === groupTopic),
      }))
      .filter((group) => group.communities.length > 0);
  }, [matching, topic]);

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
    <PhoneShell wide paperBackground>
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
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lime-deep px-4 text-[10px] font-bold text-dark transition hover:bg-dark hover:text-on-panel"
              >
                <Plus className="h-4 w-4" /> Start a community
              </Link>
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lime-pale px-3 text-[10px] font-semibold text-inksoft">
                <UsersRound className="h-3.5 w-3.5" /> Public communities
              </span>
              {previewAvailable ? (
                <button
                  type="button"
                  disabled={previewMode === null}
                  onClick={() => setPreviewMode((current) => !current)}
                  className="inline-flex h-9 items-center rounded-full border border-line px-3 text-[10px] font-semibold text-muted transition hover:border-lime-deep hover:text-ink disabled:opacity-50"
                >
                  {previewMode ? "Use live communities" : "Preview 50 sample communities"}
                </button>
              ) : null}
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
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-semibold transition ${
                    topic === item
                      ? "border-lime-deep bg-lime-deep text-dark"
                      : "border-line/70 bg-paper text-muted hover:border-lime-deep/50 hover:bg-lime-pale hover:text-ink"
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
                    {topic === "All" ? "Browse by category" : topic}
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
              <div className="space-y-4">
                {groupedCommunities.map(({ topic: groupTopic, communities: group }) => (
                  <section key={groupTopic} aria-label={`${groupTopic} communities`}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-[12px] font-bold text-ink">
                        <CommunityTopicIcon topic={groupTopic} className="h-4 w-4 text-lime-deep" />
                        {groupTopic}
                      </h3>
                      <span className="text-[10px] text-muted">
                        {group.length} {group.length === 1 ? "community" : "communities"}
                      </span>
                    </div>
                    <div
                      id={`communities-${groupTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      className="grid gap-2 sm:grid-cols-2"
                    >
                      {(expandedTopics.includes(groupTopic)
                        ? group
                        : group.slice(0, COMMUNITIES_VISIBLE_BY_DEFAULT)
                      ).map((community) => (
                        <CommunityCard
                          key={community.id}
                          community={community}
                          joining={joiningId === community.id}
                          onJoin={join}
                          previewOnly={previewMode === true}
                        />
                      ))}
                    </div>
                    {group.length > COMMUNITIES_VISIBLE_BY_DEFAULT ? (
                      <button
                        type="button"
                        aria-expanded={expandedTopics.includes(groupTopic)}
                        aria-controls={`communities-${groupTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        onClick={() =>
                          setExpandedTopics((current) =>
                            current.includes(groupTopic)
                              ? current.filter((item) => item !== groupTopic)
                              : [...current, groupTopic],
                          )
                        }
                        className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-lime-deep transition hover:bg-lime-pale"
                      >
                        {expandedTopics.includes(groupTopic)
                          ? "Show less"
                          : `Show ${group.length - COMMUNITIES_VISIBLE_BY_DEFAULT} more`}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            expandedTopics.includes(groupTopic) ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    ) : null}
                  </section>
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
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-lime-deep px-4 text-[10px] font-bold text-dark hover:bg-dark hover:text-on-panel"
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
