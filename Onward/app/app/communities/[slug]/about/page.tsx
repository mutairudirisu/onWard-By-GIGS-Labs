"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Eye, Globe, Lightbulb, LockKeyhole } from "lucide-react";
import { CommunityTopicIcon } from "@/components/community-card";
import { PhoneShell } from "@/components/phone-shell";
import {
  COMMUNITY_TYPE_OPTIONS,
  communityMediaUrl,
  fetchCommunity,
  fetchPublicCommunityIdea,
  type Community,
} from "@/lib/db";

export default function CommunityAboutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [idea, setIdea] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const nextCommunity = await fetchCommunity(slug);
        if (!nextCommunity) {
          if (active) {
            setCommunity(null);
            setIdea(null);
          }
          return;
        }
        const nextIdea = await fetchPublicCommunityIdea(nextCommunity.id);
        if (active) {
          setCommunity(nextCommunity);
          setIdea(nextIdea);
        }
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Could not load community details.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [slug, attempt]);

  const typeLabel =
    COMMUNITY_TYPE_OPTIONS.find((option) => option.value === community?.communityType)?.label ??
    "Public";
  const TypeIcon =
    community?.communityType === "public"
      ? Globe
      : community?.communityType === "restricted"
        ? Eye
        : LockKeyhole;
  const createdDate = community
    ? new Date(community.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  if (loading) {
    return (
      <PhoneShell wide>
        <div className="mx-auto w-full max-w-[1080px] space-y-4">
          <div className="card h-48 animate-pulse bg-paper" />
          <div className="card h-56 animate-pulse bg-paper" />
        </div>
      </PhoneShell>
    );
  }

  if (error || !community) {
    return (
      <PhoneShell wide>
        <div className="mx-auto w-full max-w-[1080px]">
          <Link
            href={`/communities/${slug}`}
            className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold text-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to community
          </Link>
          <section className="card px-5 py-9 text-center">
            <h1 className="text-[15px] font-bold text-ink">
              {error ? "We couldn’t open this page" : "Community not found"}
            </h1>
            {error ? <p role="alert" className="mt-2 text-[10px] text-danger">{error}</p> : null}
            {error ? (
              <button
                type="button"
                onClick={() => setAttempt((current) => current + 1)}
                className="mt-4 rounded-full bg-lime-deep px-4 py-2 text-[10px] font-bold text-dark"
              >
                Try again
              </button>
            ) : null}
          </section>
        </div>
      </PhoneShell>
    );
  }

  const bannerUrl = communityMediaUrl(community.bannerPath);
  const avatarUrl = communityMediaUrl(community.avatarPath);

  return (
    <PhoneShell wide>
      <div className="mx-auto w-full max-w-[1080px]">
        <Link
          href={`/communities/${community.slug}`}
          className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {community.name}
        </Link>

        <header className="relative overflow-hidden rounded-[24px] bg-panel px-5 pb-5 pt-20 sm:px-7">
          {bannerUrl ? (
            <>
              <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-dark/55" />
            </>
          ) : null}
          <span className="pointer-events-none absolute -right-7 -top-16 h-48 w-48 rounded-full border-[22px] border-lime/20" />
          <div className="relative flex items-end gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-lime bg-lime-pale text-lime-deep">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <CommunityTopicIcon topic={community.topic} className="h-7 w-7" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-lime">
                onWard/{community.slug}
              </p>
              <h1 className="mt-0.5 truncate text-[22px] font-bold tracking-tight text-on-panel sm:text-[26px]">
                {community.name}
              </h1>
            </div>
          </div>
        </header>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-4">
            <section className="card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-lime-deep" />
                <h2 className="text-[13px] font-bold text-ink">The starting idea</h2>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[12px] leading-[1.7] text-inksoft">
                {idea ?? "No starting idea was provided."}
              </p>
            </section>
            <section className="card p-5 sm:p-6">
              <h2 className="text-[13px] font-bold text-ink">What this community is about</h2>
              <p className="mt-3 whitespace-pre-wrap text-[12px] leading-[1.7] text-inksoft">
                {community.description}
              </p>
            </section>
          </main>

          <aside className="card p-5 sm:p-6">
            <h2 className="text-[13px] font-bold text-ink">How it was set up</h2>
            <dl className="mt-4 divide-y divide-line">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-[10px] text-muted">Topic</dt>
                <dd className="inline-flex items-center gap-1.5 text-right text-[10px] font-semibold text-ink">
                  <CommunityTopicIcon topic={community.topic} className="h-3.5 w-3.5 text-lime-deep" />
                  {community.topic}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-[10px] text-muted">Subcategory</dt>
                <dd className="text-right text-[10px] font-semibold text-ink">{community.subcategory}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-[10px] text-muted">Community type</dt>
                <dd className="inline-flex items-center gap-1.5 text-right text-[10px] font-semibold text-ink">
                  <TypeIcon className="h-3.5 w-3.5 text-lime-deep" />
                  {typeLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-[10px] text-muted">Audience</dt>
                <dd className="text-right text-[10px] font-semibold text-ink">
                  {community.isMature ? "Adults 18+" : "Everyone"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="inline-flex items-center gap-1.5 text-[10px] text-muted">
                  <CalendarDays className="h-3.5 w-3.5" /> Started
                </dt>
                <dd className="text-right text-[10px] font-semibold text-ink">{createdDate}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </PhoneShell>
  );
}
