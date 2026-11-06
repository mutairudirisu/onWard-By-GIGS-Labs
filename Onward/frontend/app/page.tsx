import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sprout } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { DefinitionRow, FeatureSplit, LimePanel } from "@/components/sections";
import {
  InsightsScreen,
  LogWardScreen,
  PortfolioScreen,
  TodayScreen,
} from "@/components/screens";
import { RadialShowcase } from "@/components/radial-showcase";
import { StepsShowcase } from "@/components/steps-showcase";
import { StudentShowcase } from "@/components/student-showcase";
import { APP_URL, SIGNUP_URL } from "@/lib/site";

/* The roles a person can actually pick in the app (Onward/app/lib/data.ts). */
const ROLES = [
  {
    name: "Software engineer",
    log: "The fix that stopped the pings, written as the change it made.",
  },
  {
    name: "Project manager",
    log: "Scope you held, risks you closed, the review you got through.",
  },
  {
    name: "Operations coordinator",
    log: "The process that stopped eating a day of the team's time.",
  },
  {
    name: "Designer",
    log: "The decision behind the screen, not just the screen.",
  },
  {
    name: "Data analyst",
    log: "The question you answered and what changed because of it.",
  },
  {
    name: "Customer success",
    log: "The account you saved, and how you knew it was slipping.",
  },
  {
    name: "Marketing",
    log: "Campaigns with the number attached, not only the screenshot.",
  },
  {
    name: "Educator",
    log: "What you tried, who got it, and what you'd change.",
  },
  {
    name: "Student",
    log: "Coursework, projects, placements — half-price Pro while you study.",
  },
];

export default function Home() {
  return (
    <main>
      {/* ————— Hero ————— */}
      <section className="relative overflow-hidden bg-night pb-12 pt-[104px] text-paper sm:pt-[132px] lg:pt-[150px]">
        <Starfield />
        <span className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-lime/10 blur-3xl" />
        <div className="container-x relative">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="h-display">
              Your growth,{" "}
              <span className="relative inline-block">
                documented
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 220 12"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M4 9C60 3 160 3 216 8"
                    stroke="currentColor"
                    className="text-lime"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-[clamp(15px,1.7vw,19px)] leading-relaxed text-paper/70">
              The wins, lessons, milestones and feedback of an ordinary week —
              dated as you log them, then compiled into a portfolio you can
              actually hand someone.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href={SIGNUP_URL} className="btn-light">
                Start free
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-[14px] font-semibold text-paper/85 transition hover:border-lime hover:text-lime"
              >
                See how it works
              </a>
            </div>
            <p className="tiny mt-5 text-paper/40">
              Free plan · no credit card · installs from your browser
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-[36px] border border-paper/10 bg-dark px-5 pb-8 pt-8 sm:px-12">
            <span className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-lime" />
            <span className="absolute right-6 top-6 hidden items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-[11px] font-semibold text-paper/70 sm:flex">
              <Sprout className="h-3.5 w-3.5 text-lime" strokeWidth={2.4} />
              Today
            </span>
            <div className="relative mx-auto mt-4">
              <TodayScreen />
            </div>
            <p className="relative mt-6 text-center text-[11px] font-medium text-paper/35">
              The app&apos;s Today screen, filled with sample entries.
            </p>
          </div>
        </div>
      </section>

      {/* ————— What actually goes in ————— */}
      <DefinitionRow
        items={[
          {
            name: "onWard",
            tagline: "A win, with the reason it mattered.",
            body: "What you did, what changed because of it, the skills you used — and one switch to put it in your portfolio.",
          },
          {
            name: "Evidence",
            tagline: "The receipt beside the claim.",
            body: "The link the thing lives at sits on the entry itself; on Pro, so do the file and the screenshot.",
          },
          {
            name: "Portfolio",
            tagline: "The page someone else can read.",
            body: "Flagged onWards gather on one page with the skills your own entries show you practising, then download as a PDF.",
          },
        ]}
      />

      {/* ————— Capture ————— */}
      <FeatureSplit
        id="features"
        eyebrow="Capture"
        title="Under a minute, before it blurs."
        body="One screen for the whole entry, reached from the plus button on any tab. The numbers and names you cannot recall next quarter are the ones a review or a CV needs."
        points={[
          "A title, what you did and what changed — two sentences is a capture",
          "Dictate the title when typing is the slower option",
          "Tag the skills you used, so the proof has a shape",
          "Four tabs on the phone, a sidebar when you open it on a laptop",
        ]}
        caption="The log screen, filled with a sample entry."
        visual={
          <LimePanel>
            <LogWardScreen />
          </LimePanel>
        }
      />

      {/* ————— Steps showcase (scroll-synced) ————— */}
      <StepsShowcase />

      {/* ————— Portfolio ————— */}
      <FeatureSplit
        id="portfolio"
        eyebrow="Proof"
        title="A portfolio built from work you already did."
        body="Flag an onWard and it appears on one page: the proof at a glance, the wins with their impact, and the skills your own entries show you practising. Then it downloads as a PDF."
        points={[
          "Skills rated Recorded, Practising or Proven by your entries",
          "The same flagged wins re-laid as a one-page CV, exported as PDF or plain text",
          "One page, one PDF — that file is the thing you send",
          "Nothing leaves your account until you export it",
          "The page says what is self-reported, so it stays credible",
        ]}
        reverse
        caption="The portfolio page and the PDF it produces, from sample entries."
        visual={<PortfolioScreen />}
      />

      {/* ————— Radial showcase ————— */}
      <section className="overflow-hidden bg-mist py-20 lg:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Everything connects</p>
            <h2 className="h2 mt-4">One record, four ways to use it.</h2>
            <p className="lead mt-5">
              The onWard is the record. Your skills and your streak are read out
              of it, and the portfolio is the part someone else can see.
            </p>
          </div>
          <div className="mt-14">
            <RadialShowcase />
          </div>
        </div>
      </section>

      {/* ————— Insights ————— */}
      <FeatureSplit
        id="insights"
        eyebrow="Stay honest"
        title="The calm version of how you're doing."
        body="Insights counts captures, not hours in a chair. The streak is only the days you turned up, and the heatmap keeps six months of them in one square each."
        points={[
          "onWards logged per week or per month",
          "A six-month heatmap — every square a day you showed up",
          "Skills showing up, ranked by the onWards that used them",
          "A leaderboard ranked by what you logged, first names only",
        ]}
        caption="Insights: the capture bars, the skills the work shows, the streak."
        visual={
          <LimePanel>
            <InsightsScreen />
          </LimePanel>
        }
      />

      {/* ————— Roles ————— */}
      <section id="audiences" className="container-x py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Built for momentum</p>
          <h2 className="h2 mt-4">Pick a role, keep the same habit.</h2>
          <p className="lead mt-5">
            Your role prints at the top of the portfolio you export, and a
            student role unlocks half-price Pro. None of these nine are a box you
            have to stay in — add your own.
          </p>
        </div>
        <div className="mt-14 grid gap-px border-y border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.name} className="bg-paper p-6 lg:p-8">
              <p className="h3">{r.name}</p>
              <p className="tiny mt-2.5">{r.log}</p>
            </div>
          ))}
        </div>
        <p className="tiny mt-6 text-center">
          Set it in the app under Your profile → Set your role.
        </p>
      </section>

      {/* ————— Student showcase ————— */}
      <StudentShowcase />

      {/* ————— CTA band ————— */}
      <section className="container-x pb-24">
        <div className="relative overflow-hidden rounded-[36px] bg-night px-6 py-16 text-center text-paper sm:px-8 sm:py-20">
          <Starfield />
          <span className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime/15 blur-2xl" />
          <div className="relative mx-auto max-w-2xl">
            <p className="eyebrow text-lime">Your next onWard starts today</p>
            <h2 className="h2 mt-4">
              Stop documenting work. Start documenting growth.
            </h2>
            <p className="lead mt-4 text-paper/60">
              Capture is free — three onWards a month. Pro removes the ceiling
              on everything that helps you go further.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/pricing" className="btn-lime">
                See pricing
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
              <a
                href={APP_URL}
                className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-[14px] font-semibold text-paper/85 transition hover:border-lime hover:text-lime"
              >
                Open the app
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
