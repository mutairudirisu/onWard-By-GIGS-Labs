"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PhoneShell } from "@/components/phone-shell";
import { NewButton, PageHeader, Tag } from "@/components/ui";
import { WardSkeleton } from "@/components/skeleton";
import { useStore } from "@/components/store";
import type { Evidence, OnWard } from "@/lib/data";
import { dayHeading, formatDue } from "@/lib/dates";
import { CalendarDays, FileText, Globe, Image, Share2, Star, Search, Trophy, X } from "lucide-react";
import { ShareSheet, wardShareText } from "@/components/share-sheet";
import { haptic } from "@/lib/haptics";
import { signedWardEvidenceUrl } from "@/lib/db";

const TABS = ["Timeline", "By skill", "Portfolio"] as const;
type Tab = (typeof TABS)[number];

const KIND_ICON = { file: FileText, url: Globe, image: Image } as const;

/** How many pieces of evidence of each kind the ward carries, in display order. */
function evidenceCounts(evidence: Evidence[]) {
  const counts = new Map<Evidence["kind"], number>();
  for (const item of evidence) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  return (["image", "file", "url"] as const)
    .map((kind) => ({ kind, n: counts.get(kind) ?? 0 }))
    .filter((group) => group.n > 0);
}

type Day = { key: string; heading: string; wards: OnWard[] };

/** One section per day, newest first; undated wins sit at the bottom. */
function groupByDay(wards: OnWard[]): Day[] {
  const groups = new Map<string, OnWard[]>();
  for (const ward of wards) {
    const key = ward.date ?? "undated";
    const bucket = groups.get(key);
    if (bucket) bucket.push(ward);
    else groups.set(key, [ward]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) =>
      a === b ? 0 : a === "undated" ? 1 : b === "undated" ? -1 : b.localeCompare(a),
    )
    .map(([key, dayWards]) => ({
      key,
      heading: key === "undated" ? "Undated" : dayHeading(key),
      wards: dayWards,
    }));
}

function WardCard({
  ward,
  favourite,
  onFavourite,
  onShare,
}: {
  ward: OnWard;
  favourite: boolean;
  onFavourite: (id: string) => void;
  onShare: (ward: OnWard) => void;
}) {
  const wardEvidence = ward.evidence ?? [];
  const evidence = evidenceCounts(wardEvidence);
  return (
    <div className="relative flex flex-col rounded-[22px] border border-line bg-paper px-4 py-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift lg:px-5 lg:py-5">
      {/* Whole card opens the onWard; the two controls sit above this overlay. */}
      <Link
        href={`/onwards/${ward.id}`}
        aria-label={`Open ${ward.title}`}
        className="absolute inset-0 rounded-[inherit]"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold text-muted">
          {ward.skills.slice(0, 2).join(" · ")}
          {ward.skills.length > 2 ? ` +${ward.skills.length - 2}` : ""}
        </p>
        <button
          type="button"
          aria-pressed={favourite}
          aria-label={favourite ? "Remove from favourites" : "Add to favourites"}
          onClick={() => onFavourite(ward.id)}
          className="relative z-10 -mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90"
        >
          <Star
            className={`h-4 w-4 ${
              favourite ? "fill-lime-deep text-lime-deep" : "text-faint"
            }`}
          />
        </button>
      </div>
      <h3 className="mt-1 text-[15px] font-bold tracking-tight text-ink [overflow-wrap:anywhere] lg:text-[17px]">
        {ward.title}
      </h3>
      <p className="mt-1.5 line-clamp-3 flex-1 text-[11.5px] leading-[1.65] text-inksoft lg:text-[13px]">
        {ward.impact}
      </p>
      {wardEvidence.length ? <EvidenceStickers evidence={wardEvidence} /> : null}
      <div className="mt-3.5 flex items-end justify-between gap-3">
        <span className="flex items-center gap-2.5 text-[10.5px] font-semibold text-muted">
          {evidence.map(({ kind, n }) => {
            const Icon = KIND_ICON[kind];
            return (
              <span key={kind} className="flex items-center gap-1" title={`${n} ${kind}`}>
                <Icon className="h-3.5 w-3.5" />
                {n}
              </span>
            );
          })}
          {ward.inPortfolio ? <span className="text-lime-deep">Portfolio</span> : null}
        </span>
        <span className="flex items-center gap-2">
          {ward.date ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-[10px] font-semibold text-inksoft">
              <CalendarDays className="h-3 w-3" />
              {formatDue(ward.date)}
            </span>
          ) : null}
          <button
            type="button"
            aria-label={`Share ${ward.title}`}
            onClick={() => onShare(ward)}
            className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-inksoft transition hover:bg-lime-soft active:scale-90"
          >
            <Share2 className="h-[15px] w-[15px]" />
          </button>
        </span>
      </div>
    </div>
  );
}

function EvidenceStickers({ evidence }: { evidence: Evidence[] }) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void Promise.all(
        evidence
          .filter((item) => item.kind === "image" && item.storagePath)
          .map(async (item) => {
            try {
              return [item.id, await signedWardEvidenceUrl(item.storagePath!)] as const;
            } catch (error) {
              console.error("Could not load an onWard image preview", error);
              return null;
            }
          }),
      ).then((entries) => {
        if (active) setSignedUrls(Object.fromEntries(entries.filter((entry) => entry !== null)));
      });
    };
    refresh();
    const refreshTimer = window.setInterval(refresh, 23 * 60 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [evidence]);

  return (
    <div
      className="mt-3 flex items-center"
      aria-label={`${evidence.length} attached item${evidence.length === 1 ? "" : "s"}`}
    >
      {evidence.slice(0, 3).map((item, index) => {
        const stickerStyle = [
          "-rotate-6",
          "rotate-3",
          "-rotate-2",
        ][index];
        const imageUrl = signedUrls[item.id];
        return (
          <span
            key={item.id}
            title={item.label}
            className={`relative -ml-2 first:ml-0 flex h-9 w-10 items-center justify-center overflow-hidden rounded-lg border-2 border-paper bg-cream text-inksoft shadow-sm ${stickerStyle}`}
          >
            {item.kind === "image" && imageUrl ? (
              // The private image URL is a short-lived signed URL.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : item.kind === "image" ? (
              <Image className="h-4 w-4" />
            ) : item.kind === "url" ? (
              <Globe className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </span>
        );
      })}
      {evidence.length > 3 ? (
        <span className="ml-1.5 text-[9px] font-semibold text-muted">
          +{evidence.length - 3} more
        </span>
      ) : null}
    </div>
  );
}

function SectionHead({ heading, caption }: { heading: string; caption: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">{heading}</h2>
      <span className="h-px flex-1 bg-line" />
      <span className="text-[11px] font-medium text-faint">{caption}</span>
    </div>
  );
}

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default function OnWardsPage() {
  const { onWards, favourites, toggleFavourite, settings, hydrated } = useStore();
  const [tab, setTab] = useState<Tab>("Timeline");
  const [query, setQuery] = useState("");
  const [sharing, setSharing] = useState<OnWard | null>(null);

  const buzzFavourite = (id: string) => {
    haptic("tap", settings.haptics);
    toggleFavourite(id);
  };

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      onWards.filter((w) => {
        if (!q) return true;
        return (
          w.title.toLowerCase().includes(q) ||
          w.impact.toLowerCase().includes(q) ||
          w.skills.some((s) => s.toLowerCase().includes(q))
        );
      }),
    [onWards, q],
  );

  const portfolio = filtered.filter((w) => w.inPortfolio);
  const bySkill = useMemo(() => {
    const groups: Record<string, OnWard[]> = {};
    for (const w of filtered) for (const s of w.skills) (groups[s] ??= []).push(w);
    return groups;
  }, [filtered]);

  const selectedCount = onWards.filter((w) => w.inPortfolio).length;

  return (
    <PhoneShell tab="onwards" wide>
      <PageHeader
        title="Your onWards"
        subtitle="Wins worth remembering, made visible."
        eyebrow={
          <span className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-lime-deep" /> {onWards.length} onWards ·{" "}
            {selectedCount} selected
          </span>
        }
        actions={<NewButton href="/onwards/new">Log an onWard</NewButton>}
      />

      <div className="mb-5 grid gap-4 lg:mb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint lg:h-[18px] lg:w-[18px]" />
          <input
            className="field-input pl-9 pr-9 lg:h-11 lg:text-[14px]"
            placeholder="Search onWards, skills, results"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search onWards"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="grid w-full grid-cols-3 gap-1 rounded-xl border border-line bg-paper p-1 lg:w-auto lg:min-w-[360px]">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg py-1.5 text-[11px] font-semibold transition lg:px-5 lg:text-[13px] ${
                tab === t ? "border border-line bg-cream text-ink shadow-card" : "text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {!hydrated ? (
        <div className={GRID}>
          {Array.from({ length: 6 }).map((_, i) => (
            <WardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted lg:text-[15px]">
          No onWards match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : tab === "Timeline" ? (
        // Grouping only sets the order here. Every card already carries its own date,
        // so a heading row above each day repeats what is underneath it.
        <div className={GRID}>
          {groupByDay(filtered)
            .flatMap((day) => day.wards)
            .map((ward) => (
              <WardCard
                key={ward.id}
                ward={ward}
                favourite={favourites.includes(ward.id)}
                onFavourite={buzzFavourite}
                onShare={setSharing}
              />
            ))}
        </div>
      ) : tab === "Portfolio" ? (
        <section>
          <SectionHead heading="In your portfolio" caption={`${portfolio.length} selected`} />
          {portfolio.length === 0 ? (
            <p className="card px-4 py-8 text-center text-[12px] text-muted lg:text-[14px]">
              Nothing selected yet. Open an onWard and add it to your portfolio.
            </p>
          ) : (
            <div className={GRID}>
              {portfolio.map((ward) => (
                <WardCard
                  key={ward.id}
                  ward={ward}
                  favourite={favourites.includes(ward.id)}
                  onFavourite={buzzFavourite}
                  onShare={setSharing}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-6 lg:space-y-8">
          <SectionHead heading="By skill" caption={plural(Object.keys(bySkill).length, "skill")} />
          {Object.entries(bySkill).map(([skill, wards]) => (
            <section key={skill}>
              <div className="mb-3">
                <Tag>{skill}</Tag>
              </div>
              <div className={GRID}>
                {wards.map((ward) => (
                  <WardCard
                    key={ward.id}
                    ward={ward}
                    favourite={favourites.includes(ward.id)}
                    onFavourite={buzzFavourite}
                    onShare={setSharing}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {sharing ? (
        <ShareSheet
          open
          onClose={() => setSharing(null)}
          defaultText={wardShareText(sharing)}
          url={`${window.location.origin}/onwards/${sharing.id}`}
        />
      ) : null}
    </PhoneShell>
  );
}
