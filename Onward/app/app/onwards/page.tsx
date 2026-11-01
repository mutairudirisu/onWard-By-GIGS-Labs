"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PhoneShell } from "@/components/phone-shell";
import { NewButton, PageHeader, Tag } from "@/components/ui";
import { useStore } from "@/components/store";
import type { OnWard } from "@/lib/data";
import { Folder, Share2, Star, Search, Trophy, X } from "lucide-react";
import { ShareSheet, wardShareText } from "@/components/share-sheet";
import { haptic } from "@/lib/haptics";

const TABS = ["Timeline", "By skill", "Portfolio"] as const;
type Tab = (typeof TABS)[number];

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
  return (
    <div className="card relative flex flex-col px-4 py-3.5 transition hover:-translate-y-0.5 hover:shadow-card lg:px-5 lg:py-4">
      {/* Whole card opens the onWard; the two controls sit above this overlay. */}
      <Link
        href={`/onwards/${ward.id}`}
        aria-label={`Open ${ward.title}`}
        className="absolute inset-0 rounded-[inherit]"
      />
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          {ward.dateLabel}
        </span>
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
      <h3 className="mt-1.5 text-[14px] font-bold tracking-tight text-ink lg:text-[16px]">
        {ward.title}
      </h3>
      <p className="mt-1 flex-1 text-[11px] text-muted lg:text-[12.5px]">{ward.impact}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {ward.skills.map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-[10px] font-medium text-muted">
          <Folder className="h-3 w-3" /> {ward.files} file{ward.files === 1 ? "" : "s"} ·{" "}
          {ward.inPortfolio ? "In your portfolio" : "Private draft"}
        </p>
        <button
          type="button"
          aria-label={`Share ${ward.title}`}
          onClick={() => onShare(ward)}
          className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-inksoft transition hover:bg-lime-soft active:scale-90"
        >
          <Share2 className="h-[15px] w-[15px]" />
        </button>
      </div>
    </div>
  );
}

export default function OnWardsPage() {
  const { onWards, favourites, toggleFavourite, settings } = useStore();
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
            {selectedCount} in portfolio
          </span>
        }
        actions={<NewButton href="/onwards/new">Log an onWard</NewButton>}
      />

      <div className="mb-4 grid gap-4 lg:mb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
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

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-muted lg:text-[15px]">
          No onWards match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : tab === "Timeline" ? (
        <>
          <div className="mb-3 flex items-end justify-between lg:mb-4">
            <h2 className="text-[15px] font-bold tracking-tight text-ink lg:text-[18px]">
              Timeline
            </h2>
            <span className="text-[11px] font-semibold text-muted lg:text-[12px]">
              {filtered.length} onWards
            </span>
          </div>
          <div className="relative space-y-3 pl-4 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 lg:pl-0 xl:grid-cols-3">
            <span className="absolute bottom-4 left-[3px] top-2 w-px bg-line lg:hidden" />
            {filtered.map((ward) => (
              <div key={ward.id} className="relative">
                <WardCard
                  ward={ward}
                  favourite={favourites.includes(ward.id)}
                  onFavourite={buzzFavourite}
                  onShare={setSharing}
                />
              </div>
            ))}
          </div>
        </>
      ) : tab === "Portfolio" ? (
        <>
          <div className="mb-3 flex items-end justify-between lg:mb-4">
            <h2 className="text-[15px] font-bold tracking-tight text-ink lg:text-[18px]">
              In your portfolio
            </h2>
            <span className="text-[11px] font-semibold text-muted lg:text-[12px]">
              {portfolio.length} selected
            </span>
          </div>
          {portfolio.length === 0 ? (
            <p className="card px-4 py-8 text-center text-[12px] text-muted lg:text-[14px]">
              Nothing selected yet. Open an onWard and add it to your portfolio.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
        </>
      ) : (
        <>
          <div className="mb-3 flex items-end justify-between lg:mb-4">
            <h2 className="text-[15px] font-bold tracking-tight text-ink lg:text-[18px]">
              By skill
            </h2>
            <span className="text-[11px] font-semibold text-muted lg:text-[12px]">
              {Object.keys(bySkill).length} skills
            </span>
          </div>
          <div className="space-y-6 lg:space-y-8">
            {Object.entries(bySkill).map(([skill, wards]) => (
              <section key={skill}>
                <div className="mb-3 flex items-center gap-2">
                  <Tag>{skill}</Tag>
                  <span className="text-[10px] font-medium text-muted lg:text-[11px]">
                    {wards.length} onWard{wards.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
        </>
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
