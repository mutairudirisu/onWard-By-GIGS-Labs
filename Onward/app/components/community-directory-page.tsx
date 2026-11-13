"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, UsersRound } from "lucide-react";
import { useAuth } from "@/components/auth";
import { CommunityCard, CommunityTopicIcon } from "@/components/community-card";
import { CommunityCarousel } from "@/components/community-carousel";
import { PhoneShell } from "@/components/phone-shell";
import { toastError, toastSuccess } from "@/components/toast";
import {
  COMMUNITY_SUBCATEGORIES,
  communitySubcategoryFromSlug,
  communitySubcategorySlug,
  communityTopicFromSlug,
  communityTopicSlug,
  fetchCommunities,
  joinCommunity,
  type Community,
} from "@/lib/db";
import { createPreviewCommunities, isCommunityPreviewEnabled } from "@/lib/community-preview";

export function CommunityDirectoryPage({
  topicSlug,
  subcategorySlug,
}: {
  topicSlug: string;
  subcategorySlug?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const topic = communityTopicFromSlug(topicSlug);
  const subcategory =
    topic && subcategorySlug ? communitySubcategoryFromSlug(topic, subcategorySlug) : null;
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<boolean | null>(null);

  useEffect(() => {
    setPreviewMode(
      isCommunityPreviewEnabled(window.location.search, window.location.hostname),
    );
  }, []);

  const load = useCallback(async () => {
    if (previewMode === null || !topic) return;
    setLoading(true);
    setError("");
    try {
      setCommunities(
        previewMode ? createPreviewCommunities() : await fetchCommunities(),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load communities.");
    } finally {
      setLoading(false);
    }
  }, [previewMode, topic]);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  const matching = useMemo(() => {
    if (!topic) return [];
    const text = query.trim().toLowerCase();
    return communities
      .filter(
        (community) =>
          community.topic === topic &&
          (!subcategory || community.subcategory === subcategory) &&
          (!text ||
            `${community.name} ${community.description} ${community.subcategory}`
              .toLowerCase()
              .includes(text)),
      )
      .sort((left, right) => right.memberCount - left.memberCount);
  }, [communities, query, subcategory, topic]);

  const subcategoryGroups = useMemo(() => {
    if (!topic) return [];
    return COMMUNITY_SUBCATEGORIES[topic]
      .map((item) => ({
        subcategory: item,
        communities: matching.filter((community) => community.subcategory === item),
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

  if (!topic || (subcategorySlug && !subcategory)) {
    return (
      <PhoneShell wide>
        <div className="card mx-auto max-w-[540px] px-5 py-9 text-center">
          <UsersRound className="mx-auto h-7 w-7 text-lime-deep" />
          <h1 className="mt-2 text-[15px] font-bold text-ink">Category not found</h1>
          <Link
            href="/communities"
            className="mt-4 inline-flex rounded-full bg-lime-deep px-4 py-2 text-[10px] font-bold text-dark"
          >
            Browse communities
          </Link>
        </div>
      </PhoneShell>
    );
  }

  const isSubcategoryPage = Boolean(subcategory);
  const backHref = isSubcategoryPage
    ? `/communities/category/${communityTopicSlug(topic)}${previewMode ? "?previewCommunities=1" : ""}`
    : `/communities${previewMode ? "?previewCommunities=1" : ""}`;
  const previewQuery = previewMode ? "?previewCommunities=1" : "";

  return (
    <PhoneShell wide>
      <main className="mx-auto w-full max-w-[1080px]">
        <header className="mb-5">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              aria-label={isSubcategoryPage ? `Back to ${topic}` : "Back to all communities"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition hover:bg-paper"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-lime-deep">
                <CommunityTopicIcon topic={topic} className="h-3 w-3" />
                {topic}
              </p>
              <h1 className="mt-0.5 truncate text-[22px] font-bold tracking-tight text-ink sm:text-[25px]">
                {subcategory ?? topic}
              </h1>
            </div>
          </div>
          <p className="ml-12 mt-1 max-w-[60ch] text-[12px] leading-[1.6] text-inksoft">
            {isSubcategoryPage
              ? `Discover ${subcategory?.toLowerCase()} communities, ranked by membership.`
              : `Explore ${topic.toLowerCase()} communities by subcategory.`}
          </p>
        </header>

        {isSubcategoryPage ? (
          <label className="mb-4 flex h-11 items-center gap-2 rounded-full border border-line bg-paper px-4 focus-within:border-lime-deep">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${subcategory} communities`}
              aria-label={`Search ${subcategory} communities`}
              className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
            />
          </label>
        ) : (
          <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 wheel" aria-label={`${topic} subcategories`}>
            {COMMUNITY_SUBCATEGORIES[topic].map((item) => {
              const count = communities.filter(
                (community) => community.topic === topic && community.subcategory === item,
              ).length;
              return (
                <Link
                  key={item}
                  href={`/communities/category/${communityTopicSlug(topic)}/${communitySubcategorySlug(item)}${previewQuery}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-2 text-[10px] font-semibold text-inksoft transition hover:border-lime-deep/50 hover:bg-lime-pale hover:text-ink"
                >
                  {item}
                  <span className="text-[9px] text-muted">{count}</span>
                </Link>
              );
            })}
          </nav>
        )}

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
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="card h-28 animate-pulse bg-paper" />
            ))}
          </div>
        ) : isSubcategoryPage ? (
          matching.length ? (
            <section aria-label={`${subcategory} communities`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-[12px] font-bold text-ink">Popular communities</h2>
                <span className="text-[10px] text-muted">{matching.length} found</span>
              </div>
              <ol className="list-none space-y-2 p-0">
                {matching.map((community) => (
                  <li key={community.id} className="min-w-0">
                    <CommunityCard
                      community={community}
                      joining={joiningId === community.id}
                      onJoin={join}
                      previewOnly={previewMode === true}
                    />
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <div className="card px-5 py-9 text-center">
              <UsersRound className="mx-auto h-7 w-7 text-lime-deep" />
              <h2 className="mt-2 text-[14px] font-bold text-ink">
                {query.trim() ? "No communities match that search" : "No communities here yet"}
              </h2>
              <p className="mt-1 text-[10px] text-muted">
                {query.trim() ? "Try another search." : "Check back soon or start a community of your own."}
              </p>
              {!query.trim() ? (
                <Link
                  href="/communities/new"
                  className="mt-4 inline-flex rounded-full bg-lime-deep px-4 py-2 text-[10px] font-bold text-dark"
                >
                  Start a community
                </Link>
              ) : null}
            </div>
          )
        ) : subcategoryGroups.length ? (
          <div className="space-y-5">
            {subcategoryGroups.map(({ subcategory: item, communities: group }) => (
              <CommunityCarousel
                key={item}
                id={`subcategory-${communitySubcategorySlug(item)}`}
                title={item}
                communities={group}
                moreHref={`/communities/category/${communityTopicSlug(topic)}/${communitySubcategorySlug(item)}${previewQuery}`}
                joiningId={joiningId}
                onJoin={join}
                previewOnly={previewMode === true}
              />
            ))}
          </div>
        ) : (
          <div className="card px-5 py-9 text-center">
            <UsersRound className="mx-auto h-7 w-7 text-lime-deep" />
            <h2 className="mt-2 text-[14px] font-bold text-ink">No communities match that search</h2>
            <p className="mt-1 text-[10px] text-muted">Try another search or choose a subcategory.</p>
          </div>
        )}
      </main>
    </PhoneShell>
  );
}
