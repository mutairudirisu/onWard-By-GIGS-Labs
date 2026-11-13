"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  ChevronRight,
  Flame,
  LockKeyhole,
  MessageCircle,
  PenLine,
  Sparkles,
  Users,
} from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import {
  EXCHANGE_ACHIEVEMENT_CATEGORIES,
  getExchangeAchievement,
  getExchangeAchievementCategory,
  getExchangeAchievements,
  type ExchangeAchievement,
} from "@/lib/exchange-achievements";
import { fetchProfileCard, type ProfileCard } from "@/lib/db";

type Props = {
  profileId: string;
  categoryId?: string;
  achievementId?: string;
};

function AchievementIcon({
  kind,
  className,
}: {
  kind: ExchangeAchievement["icon"];
  className: string;
}) {
  if (kind === "post") return <PenLine className={className} aria-hidden="true" />;
  if (kind === "comment") return <MessageCircle className={className} aria-hidden="true" />;
  if (kind === "followers") return <Users className={className} aria-hidden="true" />;
  return <Flame className={className} aria-hidden="true" />;
}

function progressLabel(achievement: ExchangeAchievement) {
  const unit =
    achievement.target === 1 ? achievement.unit.replace(/s$/, "") : achievement.unit;
  return `${Math.min(achievement.value, achievement.target)} / ${achievement.target} ${unit}`;
}

function AchievementMedal({
  achievement,
  size = "card",
}: {
  achievement: ExchangeAchievement;
  size?: "card" | "detail";
}) {
  return (
    <span
      className={`relative mx-auto flex shrink-0 items-center justify-center rounded-full border-[4px] shadow-sm ${
        size === "detail" ? "h-56 w-56 md:h-64 md:w-64" : "h-28 w-28"
      } ${
        achievement.earned
          ? "border-amber-400 bg-gradient-to-br from-yellow-100 via-lime to-lime-deep text-dark shadow-[inset_0_2px_8px_rgba(255,255,255,0.65),0_8px_18px_rgba(36,51,19,0.15)]"
          : "border-slate-200 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-300 grayscale"
      }`}
      aria-hidden="true"
    >
      <span
        className={`absolute inset-1.5 rounded-full border ${
          achievement.earned ? "border-white/60" : "border-white/80"
        }`}
      />
      <span
        className={`relative flex items-center justify-center rounded-full ${
          size === "detail" ? "h-36 w-36 md:h-40 md:w-40" : "h-[72px] w-[72px]"
        } ${achievement.earned ? "bg-white/25" : "bg-white/55"}`}
      >
        <AchievementIcon
          kind={achievement.icon}
          className={size === "detail" ? "h-20 w-20 md:h-24 md:w-24" : "h-10 w-10"}
        />
      </span>
      {achievement.earned ? (
        <Sparkles
          className={`absolute ${size === "detail" ? "left-9 top-9 h-7 w-7" : "left-4 top-4 h-4 w-4"} text-white`}
        />
      ) : (
        <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-paper bg-slate-200 text-slate-500">
          <LockKeyhole className="h-3.5 w-3.5" />
        </span>
      )}
    </span>
  );
}

function AchievementCard({
  achievement,
  profileId,
  width = "row",
}: {
  achievement: ExchangeAchievement;
  profileId: string;
  width?: "row" | "grid";
}) {
  const href = `/people/${profileId}/achievements/${achievement.category}/${achievement.id}`;
  return (
    <Link
      href={href}
      className={`snap-start text-center transition hover:-translate-y-0.5 ${
        width === "row" ? "w-36 shrink-0" : "w-full"
      }`}
      aria-label={`${achievement.title}, ${
        achievement.earned ? "unlocked" : progressLabel(achievement)
      }`}
    >
      <AchievementMedal achievement={achievement} />
      <h3 className="mt-3 line-clamp-2 min-h-8 text-[11px] font-bold leading-[1.35] text-ink">
        {achievement.title}
      </h3>
      <p className="mt-0.5 text-[10px] text-muted">
        {achievement.earned ? "Unlocked" : progressLabel(achievement)}
      </p>
      {!achievement.earned ? (
        <div
          className="mx-auto mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label={`${achievement.title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={achievement.progressPercent}
        >
          <span
            className="block h-full rounded-full bg-lime-deep"
            style={{ width: `${achievement.progressPercent}%` }}
          />
        </div>
      ) : null}
    </Link>
  );
}

function AchievementProgress({ achievement }: { achievement: ExchangeAchievement }) {
  return (
    <div
      className="mt-5 h-2 overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-label={`${achievement.title} progress`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={achievement.progressPercent}
    >
      <span
        className="block h-full rounded-full bg-lime-deep transition-[width]"
        style={{ width: `${achievement.progressPercent}%` }}
      />
    </div>
  );
}

function PageHeader({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  return (
    <header className="mb-5 flex items-center gap-3">
      <Link
        href={href}
        aria-label="Go back"
        className="-ml-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-cream"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-[18px] font-bold tracking-tight text-ink">
        {title}
      </h1>
      <Award className="h-5 w-5 shrink-0 text-lime-deep" aria-hidden="true" />
    </header>
  );
}

function LoadingState() {
  return (
    <PhoneShell tab="feed">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-48 rounded-full bg-cream" />
        <div className="h-36 rounded-2xl bg-cream" />
        <div className="h-5 w-40 rounded bg-cream" />
        <div className="h-36 rounded-2xl bg-cream" />
      </div>
    </PhoneShell>
  );
}

export function ExchangeAchievementsPage({
  profileId,
  categoryId,
  achievementId,
}: Props) {
  const [profile, setProfile] = useState<ProfileCard | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setProfile(undefined);
    setError("");
    void fetchProfileCard(profileId)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "Could not load achievements.");
        setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (profile === undefined) return <LoadingState />;

  const achievements = profile
    ? getExchangeAchievements({
        posts: profile.posts,
        comments: profile.comments,
        followers: profile.followers,
        longestStreak: profile.longestStreak,
      })
    : [];
  const earnedCount = achievements.filter((achievement) => achievement.earned).length;
  const category = categoryId ? getExchangeAchievementCategory(categoryId) : null;
  const achievement = achievementId
    ? getExchangeAchievement(achievements, achievementId)
    : null;
  const validAchievement =
    achievement && achievement.category === categoryId ? achievement : null;
  const backHref = achievementId
    ? `/people/${profileId}/achievements/${categoryId}`
    : categoryId
      ? `/people/${profileId}/achievements`
      : `/people/${profileId}`;
  const title = achievementId
    ? validAchievement?.title ?? "Achievement"
    : categoryId
      ? category?.title ?? "Achievements"
      : "Achievements";

  if (!profile || error) {
    return (
      <PhoneShell tab="feed">
        <PageHeader href={`/people/${profileId}`} title="Achievements" />
        <div className="rounded-2xl border border-dash bg-paper px-5 py-8 text-center">
          <p className="text-[13px] font-semibold text-ink">
            {error ? "Achievements couldn't be loaded" : "This profile is out of reach"}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {error || "The profile may have been removed, or the link is not right."}
          </p>
        </div>
      </PhoneShell>
    );
  }

  if (categoryId && !category) {
    return (
      <PhoneShell tab="feed">
        <PageHeader href={backHref} title="Achievements" />
        <p className="rounded-2xl border border-dash px-4 py-6 text-center text-[11px] text-muted">
          This achievement category could not be found.
        </p>
      </PhoneShell>
    );
  }

  if (achievementId && !validAchievement) {
    return (
      <PhoneShell tab="feed">
        <PageHeader href={backHref} title="Achievements" />
        <p className="rounded-2xl border border-dash px-4 py-6 text-center text-[11px] text-muted">
          This achievement could not be found.
        </p>
      </PhoneShell>
    );
  }

  if (achievementId && validAchievement) {
    return (
      <PhoneShell tab="feed">
        <PageHeader href={backHref} title={validAchievement.title} />
        <section className="mx-auto max-w-xl pb-4 text-center">
          <p className="mb-5 text-[11px] text-muted">{category?.title ?? "Exchange achievement"}</p>
          <AchievementMedal achievement={validAchievement} size="detail" />
          <h2 className="mt-6 text-[22px] font-bold tracking-tight text-ink">
            {validAchievement.title}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-[1.6] text-muted">
            {validAchievement.description}
          </p>

          <section className="mt-8 rounded-2xl bg-panel px-5 py-5 text-left">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-on-panel">
                {validAchievement.earned ? "Achievement unlocked" : "Progress"}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-on-panel">
                {validAchievement.earned
                  ? "Complete"
                  : progressLabel(validAchievement)}
              </span>
            </div>
            <AchievementProgress achievement={validAchievement} />
          </section>

          <Link
            href="/feed"
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-dark px-5 text-[12px] font-bold text-white transition hover:bg-lime-deep hover:text-dark"
          >
            Explore the Exchange
          </Link>
        </section>
      </PhoneShell>
    );
  }

  if (categoryId && category) {
    const categoryAchievements = achievements.filter(
      (item) => item.category === category.id,
    );
    const categoryEarned = categoryAchievements.filter((item) => item.earned).length;
    return (
      <PhoneShell tab="feed">
        <PageHeader href={backHref} title={category.title} />
        <section className="rounded-2xl bg-panel px-4 py-4">
          <p className="text-[12px] font-bold text-on-panel">
            {categoryEarned} of {categoryAchievements.length} unlocked
          </p>
          <p className="mt-1 text-[10px] text-[#A9AAA0]">
            Keep sharing, joining conversations, and showing up.
          </p>
        </section>
        <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3">
          {categoryAchievements.map((item) => (
            <AchievementCard key={item.id} achievement={item} profileId={profileId} width="grid" />
          ))}
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell tab="feed">
      <PageHeader href={`/people/${profileId}`} title="Achievements" />
      <section className="mb-5 rounded-2xl bg-panel px-4 py-4">
        <p className="text-[12px] font-bold text-on-panel">
          {earnedCount} of {achievements.length} unlocked
        </p>
        <p className="mt-1 text-[10px] text-[#A9AAA0]">
          Milestones earned through Exchange activity and onWard streaks.
        </p>
      </section>

      <div className="space-y-2">
        {EXCHANGE_ACHIEVEMENT_CATEGORIES.map((item) => {
          const categoryAchievements = achievements.filter(
            (achievementItem) => achievementItem.category === item.id,
          );
          const categoryEarned = categoryAchievements.filter(
            (achievementItem) => achievementItem.earned,
          ).length;
          if (!categoryAchievements.length) return null;

          return (
            <section key={item.id} className="border-t border-line py-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[14px] font-bold text-ink">{item.title}</h2>
                  <p className="mt-0.5 text-[10.5px] text-muted">
                    {categoryEarned} of {categoryAchievements.length} unlocked
                  </p>
                </div>
                <Link
                  href={`/people/${profileId}/achievements/${item.id}`}
                  className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-semibold text-inksoft transition hover:text-lime-deep"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div
                className="wheel -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 xl:-mx-14 xl:px-14"
                aria-label={`${item.title} achievements`}
              >
                {categoryAchievements.map((achievementItem) => (
                  <AchievementCard
                    key={achievementItem.id}
                    achievement={achievementItem}
                    profileId={profileId}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </PhoneShell>
  );
}
