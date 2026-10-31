"use client";

import { useState, type ReactNode } from "react";
import {
  Briefcase,
  Building2,
  Hammer,
  Users,
  Check,
  MapPin,
  CalendarDays,
  GraduationCap,
  ArrowRightLeft,
  Blocks,
  TrendingUp,
} from "lucide-react";

const AUDIENCES = [
  {
    id: "seekers",
    label: "For Job Seekers",
    Icon: Briefcase,
    title: "Walk into interviews with proof, not promises.",
    body: "Every task you finish, every skill you log quietly builds a portfolio employers can actually see.",
    points: [
      "Shareable onWard link for every application",
      "Achievements grouped by role and skill",
      "Interview talking points, auto-summarised",
    ],
    card: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Portfolio snapshot
          </p>
          <p className="mt-2 text-[15px] font-bold leading-snug">
            Front-end growth — 12 weeks
          </p>
          <div className="mt-3 h-2 rounded-full bg-mist">
            <div className="h-2 w-[72%] rounded-full bg-lime-deep" />
          </div>
          <p className="tiny mt-2">72% of this quarter&apos;s onWards logged</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-paper p-4 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-soft">
            <Check className="h-4 w-4 text-lime-deep" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[13px] font-semibold">Shipped a portfolio site</p>
            <p className="tiny">Verified milestone · shared 3 times</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "managers",
    label: "For Managers",
    Icon: Building2,
    title: "See momentum without standing meetings.",
    body: "Team onWards surface who is growing, who is stuck and what actually got done this week — no status theatre.",
    points: [
      "Weekly momentum digest per teammate",
      "Praise a win in one tap, tied to real output",
      "1:1 talking points pulled from the timeline",
    ],
    card: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Team · this week
          </p>
          <ul className="mt-3 space-y-2.5">
            {[
              ["Az", "Ayesha", "+6 onWards"],
              ["Ka", "Kofi", "+4 onWards"],
              ["Mi", "Mina", "2 streaks"],
            ].map(([initials, name, note]) => (
              <li key={name} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mist text-[11px] font-bold text-ink">
                  {initials}
                </span>
                <span className="flex-1 text-[13px] font-semibold">{name}</span>
                <span className="rounded-full bg-lime-soft px-2.5 py-1 text-[11px] font-bold text-ink">
                  {note}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[13px] font-semibold">Weekly digest ready</p>
          <p className="tiny mt-1">16 onWards logged · 3 milestones verified</p>
        </div>
      </div>
    ),
  },
  {
    id: "freelancers",
    label: "For Freelancers",
    Icon: Hammer,
    title: "Turn scattered client work into a track record.",
    body: "Bill hours, log outcomes and let the onWard timeline double as the case-study page you pitch with.",
    points: [
      "Client-branded milestones with visible impact",
      "Notes template for every project wrap-up",
      "Public share page you can link in proposals",
    ],
    card: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Active client
          </p>
          <p className="mt-2 text-[15px] font-bold">Northwind — Q4 relaunch</p>
          <div className="mt-3 flex gap-2">
            {["Design", "Build", "Launch"].map((t, i) => (
              <span
                key={t}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  i < 2 ? "bg-lime text-ink" : "bg-mist text-muted"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-paper p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mist">
              <CalendarDays className="h-4 w-4 text-ink" />
            </span>
            <div>
              <p className="text-[13px] font-semibold">11h logged today</p>
              <p className="tiny">3 onWards tied to client work</p>
            </div>
          </div>
          <span className="text-[13px] font-bold text-ink">₦840k</span>
        </div>
      </div>
    ),
  },
  {
    id: "teams",
    label: "For Teams",
    Icon: Users,
    title: "A shared record of growth the whole team can see.",
    body: "Shared spaces keep team goals visible while everyone keeps a personal, private layer of their own momentum.",
    points: [
      "Team onWard spaces with visible goals",
      "Celebrations that ping the right channel",
      "Private by default — personal logs stay yours",
    ],
    card: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Team space
          </p>
          <p className="mt-2 text-[15px] font-bold">Ship the mobile beta</p>
          <div className="mt-3 h-2 rounded-full bg-mist">
            <div className="h-2 w-[58%] rounded-full bg-lime-deep" />
          </div>
          <p className="tiny mt-2">58% · 7 of 12 milestones logged</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-paper p-4 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-soft">
            <MapPin className="h-4 w-4 text-lime-deep" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[13px] font-semibold">New onWard from Tobi</p>
            <p className="tiny">&ldquo;Beta crash rate under 1%&rdquo; · just now</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "students",
    label: "For Students",
    Icon: GraduationCap,
    title: "Graduate with a record, not just a transcript.",
    body: "Coursework, side projects, internships and club wins get logged as you go — so final-year you has proof of everything first-year you planned.",
    points: [
      "A portfolio that grows every semester",
      "Internship and project milestones in one link",
      "Skills mapped before you ever write a CV",
    ],
    card: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Semester 6 · record
          </p>
          <p className="mt-2 text-[15px] font-bold leading-snug">
            BSc building live
          </p>
          <div className="mt-3 h-2 rounded-full bg-mist">
            <div className="h-2 w-[64%] rounded-full bg-lime-deep" />
          </div>
          <p className="tiny mt-2">18 coursework &amp; project onWards logged</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-paper p-4 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-soft">
            <Check className="h-4 w-4 text-lime-deep" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[13px] font-semibold">Summer internship done</p>
            <p className="tiny">Verified milestone · added to portfolio</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "changers",
    label: "For Career Changers",
    Icon: ArrowRightLeft,
    title: "Cross into a new field with receipts.",
    body: "Your old job no longer describes your new one. onWard logs the bridge — courses, transfers, tiny wins — so the next team sees momentum, not a gap.",
    points: [
      "Transferable skills, tagged and visible",
      "New-skill milestones with real proof",
      "One link that explains the pivot",
    ],
    card: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            The pivot
          </p>
          <p className="mt-2 text-[15px] font-bold">Marketing → Product</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Bridged", "Bridged", "Learning"].map((t, i) => (
              <span
                key={t + i}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  i < 2 ? "bg-lime text-ink" : "bg-mist text-muted"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-paper p-4 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-soft">
            <TrendingUp className="h-4 w-4 text-lime-deep" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[13px] font-semibold">4th cert this quarter</p>
            <p className="tiny">Proof you are serious, not just curious</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "builders",
    label: "For Builders",
    Icon: Blocks,
    title: "Build in public without the daily-post anxiety.",
    body: "Ship quietly and let onWard keep the timeline. Every version, lesson and launch is captured, so building in public becomes sharing what already happened.",
    points: [
      "Auto-dated build log ready for launch threads",
      "Milestones from versions, notes and wins",
      "Share a live page instead of a pitch deck",
    ],
    card: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Ship log
          </p>
          <ul className="mt-3 space-y-2.5">
            {[
              ["v0.4", "Onboarding rewritten", "2 days ago"],
              ["v0.3", "Offline sync landed", "last week"],
              ["v0.2", "First 100 users", "this month"],
            ].map(([tag, note, when]) => (
              <li key={tag} className="flex items-center gap-3">
                <span className="rounded-full bg-lime-soft px-2 py-0.5 text-[10px] font-bold text-ink">
                  {tag}
                </span>
                <span className="flex-1 text-[12.5px] font-semibold">{note}</span>
                <span className="tiny text-faint">{when}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[13px] font-semibold">12 builds this quarter</p>
          <p className="tiny mt-1">Timeline updated automatically · shared 5×</p>
        </div>
      </div>
    ),
  },
  {
    id: "promotions",
    label: "For Promotions",
    Icon: TrendingUp,
    title: "Make the case for your next level.",
    body: "Promotions are won with evidence collected all year. onWard keeps a running record of impact so your self-review practically writes itself.",
    points: [
      "Impact logged against the competencies you're graded on",
      "Self-review drafted from real onWards",
      "Weekly wins so nothing slips past review season",
    ],
    card: (
      <div className="space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Case for L5
          </p>
          <p className="mt-2 text-[15px] font-bold leading-snug">
            Impact vs. grade rubric
          </p>
          <div className="mt-3 h-2 rounded-full bg-mist">
            <div className="h-2 w-[81%] rounded-full bg-lime-deep" />
          </div>
          <p className="tiny mt-2">81% of rubric lines have logged evidence</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-paper p-4 shadow-card">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-soft">
            <Check className="h-4 w-4 text-lime-deep" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-[13px] font-semibold">Self-review drafted</p>
            <p className="tiny">From 27 onWards · ready to edit</p>
          </div>
        </div>
      </div>
    ),
  },
] as const;

export function AudiencesTabs() {
  const [active, setActive] = useState<number>(0);
  const current = AUDIENCES[active];

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2.5">
        {AUDIENCES.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setActive(i)}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition ${
              i === active
                ? "bg-ink text-paper"
                : "border border-line bg-paper text-ink/70 hover:border-ink/40 hover:text-ink"
            }`}
          >
            <a.Icon className="h-4 w-4" strokeWidth={2.2} />
            {a.label}
          </button>
        ))}
      </div>
      <div className="mt-10 grid items-center gap-10 rounded-[32px] bg-mist p-8 sm:p-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="h3 text-[24px] sm:text-[28px]">{current.title}</h3>
          <p className="lead mt-4 text-[15px] sm:text-[16px]">{current.body}</p>
          <ul className="mt-6 space-y-3">
            {current.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[14px] font-medium text-ink/85">
                <span className="check">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-sm">{current.card as ReactNode}</div>
      </div>
    </div>
  );
}
