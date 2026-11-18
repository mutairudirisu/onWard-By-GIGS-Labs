"use client";

import Link from "next/link";
import { Avatar } from "@/components/feed-post";
import { HeatLegend, HeatMap } from "@/components/heat-map";
import { InstallButton } from "@/components/install-button";
import { PhoneShell } from "@/components/phone-shell";
import { ReferralCard } from "@/components/referral-card";
import { ShareButton } from "@/components/share-button";
import { Button, PageHeader, Tag } from "@/components/ui";
import { CvEntryButton } from "@/components/cv-entry-button";
import { ProBadge } from "@/components/pro";
import { useStore } from "@/components/store";
import { useCurrentUser } from "@/components/auth";
import { heatmapFrom, useActivity } from "@/lib/activity";
import {
  BarChart3,
  Crown,
  FileDown,
  FileText,
  Flame,
  GraduationCap,
  Pencil,
  Settings,
  Share2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { isStudentRole } from "@/lib/student";

export default function ProfilePage() {
  const { skills, onWards, isPro } = useStore();
  const user = useCurrentUser();
  const { days, streak } = useActivity();
  const grid = heatmapFrom(days);
  const student = isStudentRole(user.role);
  const headline = [user.role, user.location].filter(Boolean).join(" · ");
  const shareText = `I'm on a ${streak.current}-day onWard streak — ${streak.daysUsing} days of showing up and turning small steps into progress.`;

  return (
    <PhoneShell tab="you" wide>
      <PageHeader
        title="Your profile"
        subtitle={headline || "Set your role to shape your portfolio."}
        actions={
          <>
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-inksoft transition hover:bg-cream lg:h-10 lg:w-10"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Link>
            <ShareButton
              text={shareText}
              label=""
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-inksoft transition hover:bg-cream lg:h-10 lg:w-10"
            />
            <Link
              href="/profile/edit"
              aria-label="Edit profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-dark transition hover:bg-lime-deep lg:h-10 lg:w-10"
            >
              <Pencil className="h-[17px] w-[17px]" />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        {/* Main column */}
        <div className="space-y-4">
          <section className="card px-5 py-5">
            <div className="flex items-start gap-4">
              <Avatar initials={user.initials} src={user.avatarUrl} size="xl" />
              <div className="min-w-0 flex-1">
                <h2 className="text-[17px] font-bold tracking-tight text-ink lg:text-[22px]">
                  {user.name}
                </h2>
                {user.username ? (
                  <p className="text-[10px] font-medium text-muted lg:text-[12px]">
                    @{user.username}
                  </p>
                ) : null}
                <p className="text-[11px] font-medium text-inksoft lg:text-[13px]">{user.role}</p>
                <p className="mt-0.5 text-[10px] text-muted lg:text-[12px]">{user.location}</p>
              </div>
              <Link
                href="/profile/role"
                className="shrink-0 rounded-full border border-dash bg-paper px-3 py-1.5 text-[10px] font-semibold text-inksoft hover:border-lime-deep lg:text-[12px]"
              >
                Set role
              </Link>
            </div>
            <p className="mt-4 max-w-[62ch] text-[12px] leading-[1.65] text-inksoft lg:text-[14px]">
              {user.bio || "No bio yet — a line about the work you do heads your portfolio."}
              {/* The card's only other way in is the header pencil, which opens the whole
                  form at the top. This lands on the bio itself. */}
              <Link
                href="/profile/edit?field=bio"
                className="ml-2 inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-dash bg-paper px-2 py-0.5 align-middle text-[9.5px] font-semibold text-inksoft transition hover:border-lime-deep lg:text-[11px]"
              >
                <Pencil className="h-2.5 w-2.5" />
                Edit bio
              </Link>
            </p>
            <div className="mt-5 grid grid-cols-3 divide-x divide-line border-t border-line pt-4 text-center">
              {[
                { value: String(onWards.length), label: "onWards" },
                { value: String(skills.length), label: "skills" },
                { value: String(days.length), label: "active days" },
              ].map((s) => (
                <span key={s.label}>
                  <span className="block text-[20px] font-bold tracking-tight text-ink lg:text-[26px]">
                    {s.value}
                  </span>
                  <span className="block text-[10px] font-medium text-muted lg:text-[12px]">
                    {s.label}
                  </span>
                </span>
              ))}
            </div>
          </section>

            <Link href="/streaks" className="flex items-center gap-4 rounded-2xl bg-panel px-5 py-4 transition hover:brightness-110">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2B2C24]">
              <Flame className="h-6 w-6 text-lime" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-on-panel lg:text-[18px]">
                {streak.current}-day streak
              </span>
              <span className="block text-[10px] text-[#A9AAA0] lg:text-[12px]">
                {streak.daysUsing} days using onWard · longest {streak.longest}
              </span>
            </span>
            <Share2 className="h-5 w-5 shrink-0 text-[#A9AAA0]" />
          </Link>

          <section className="card px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold tracking-tight text-ink lg:text-[17px]">
                Your last 6 months
              </h2>
              <span className="text-[10px] text-muted lg:text-[12px]">
                {days.length} active days
              </span>
            </div>
            <HeatMap cells={grid} />
            <div className="mt-3 flex justify-end">
              <HeatLegend />
            </div>
          </section>

          <ReferralCard />
        </div>

        {/* Right rail */}
        <aside className="space-y-4">
          <Link
            href="/upgrade"
            className={`flex items-center gap-3 rounded-2xl px-5 py-4 transition ${
              isPro ? "bg-panel text-on-panel hover:brightness-110" : "bg-lime text-dark hover:bg-lime-deep"
            }`}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isPro ? "bg-[#2B2C24]" : "bg-dark/10"
              }`}
            >
              {isPro ? <Crown className="h-5 w-5 text-lime" strokeWidth={2.2} /> : <Sparkles className="h-5 w-5" strokeWidth={2.4} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[14px] font-bold lg:text-[16px]">
                  {isPro ? "onWard Pro" : "Upgrade to Pro"}
                </span>
                {isPro ? <ProBadge /> : null}
              </span>
              <span className={`block text-[10px] lg:text-[12px] ${isPro ? "text-[#A9AAA0]" : "text-dark/70"}`}>
                {isPro
                  ? "Every capability unlocked"
                  : "Unlimited onWards and evidence on every capture"}
              </span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={isPro ? "text-[#A9AAA0]" : "text-dark/60"} aria-hidden>
              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <section className="card px-5 py-4">
            <div className="mb-2.5 flex items-end justify-between">
              <h2 className="text-[14px] font-bold tracking-tight text-ink lg:text-[17px]">
                My skills
              </h2>
              <Link
                href="/profile/edit"
                className="text-[11px] font-semibold text-muted no-underline hover:no-underline"
              >
                Edit skills
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
            <p className="mt-2.5 text-[10px] text-muted lg:text-[11.5px]">
              Tagged on an onWard, or added in Edit profile.
            </p>
          </section>

          <section className="card px-5 py-4">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-[14px] font-bold tracking-tight text-ink lg:text-[17px]">
                Digital skills
              </h2>
              <span className="rounded-full bg-cream px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                Coming soon
              </span>
            </div>
            <p className="text-[10px] leading-[1.55] text-muted lg:text-[11.5px]">
              Short assessments that score your digital skills and add verified results to your
              portfolio.
            </p>
            <div className="mt-3 rounded-xl border border-dashed border-dash bg-cream/60 px-3.5 py-3">
              <p className="text-[10px] font-semibold text-inksoft">
                We&apos;re building the first tests now.
              </p>
            </div>
          </section>

          <div className="grid gap-2.5">
            <Link href="/student" className="card flex items-center gap-3 px-4 py-3.5">
              <GraduationCap className="h-[18px] w-[18px] text-inksoft" />
              <span className="flex-1 text-[13px] font-semibold text-ink lg:text-[14px]">
                Student space
              </span>
              <span className="text-[11px] font-semibold text-muted">
                {student ? "Student rate on" : "Half-price Pro"}
              </span>
            </Link>
            <Link href="/leaderboard" className="card flex items-center gap-3 px-4 py-3.5">
              <Trophy className="h-[18px] w-[18px] text-inksoft" />
              <span className="flex-1 text-[13px] font-semibold text-ink lg:text-[14px]">
                Team leaderboard
              </span>
              <span className="text-[11px] font-semibold text-muted">See where you stand</span>
            </Link>
            <Link href="/insights" className="card flex items-center gap-3 px-4 py-3.5">
              <BarChart3 className="h-[18px] w-[18px] text-inksoft" />
              <span className="flex-1 text-[13px] font-semibold text-ink lg:text-[14px]">
                See your insights
              </span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                className="text-muted"
                aria-hidden
              >
                <path
                  d="m9 6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="/settings" className="card flex items-center gap-3 px-4 py-3.5">
              <Settings className="h-[18px] w-[18px] text-inksoft" />
              <span className="flex-1 text-[13px] font-semibold text-ink lg:text-[14px]">
                Settings
              </span>
              <span className="text-[11px] font-semibold text-muted">Theme, notifications</span>
            </Link>
            <InstallButton className="card w-full items-center px-4 py-3.5 text-[13px] font-semibold text-ink lg:text-[14px]" />
          </div>

          <Button href="/portfolio" iconLeft={<FileText className="h-4 w-4" />}>
            My portfolio
          </Button>

          <div className="mt-2">
            <CvEntryButton variant="secondary" iconLeft={<FileDown className="h-4 w-4" />}>
              My CV
            </CvEntryButton>
          </div>

          <p className="pt-2 text-center text-[9.5px] font-medium tracking-[0.08em] text-faint">
            onWard v{process.env.NEXT_PUBLIC_APP_VERSION} · by GIGS Labs
          </p>
        </aside>
      </div>
    </PhoneShell>
  );
}
