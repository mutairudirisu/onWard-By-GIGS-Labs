import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sprout } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { DefinitionRow, FeatureSplit, LimePanel } from "@/components/sections";
import {
  CreateSheetScreen,
  InsightsScreen,
  NotesScreen,
  PortfolioScreen,
  ReminderScreen,
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
              Tasks, notes and the wins in between — dated as you log them, then
              compiled into a portfolio you can actually hand someone.
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
            name: "Task",
            tagline: "Today, and the steps inside it.",
            body: "One line per task, Enter for each step, and the task closes when every step does. Give it a time and it becomes a reminder.",
          },
          {
            name: "Note",
            tagline: "Room for ideas before they become something.",
            body: "Tickable lines, numbered steps or plain prose. Tagged, pinnable, and grouped by the day you wrote it.",
          },
          {
            name: "onWard",
            tagline: "A win, with the reason it mattered.",
            body: "What you did, what changed because of it, the skills you used — and one switch to put it in your portfolio.",
          },
        ]}
      />

      {/* ————— Capture ————— */}
      <FeatureSplit
        id="features"
        eyebrow="Capture the loop"
        title="One tap, from wherever you already are."
        body="The plus button opens a single sheet, so momentum never waits for the right app or the right screen. Everything lands on the same dated record."
        points={[
          "A task, a note or an onWard from the same button",
          "Enter adds the next step — a task is a checklist by default",
          "Dictate the title when typing is the slower option",
          "Five tabs on the phone, a sidebar when you open it on a laptop",
        ]}
        caption="The create sheet, exactly as it opens above the tab bar."
        visual={
          <LimePanel>
            <CreateSheetScreen />
          </LimePanel>
        }
      />

      {/* ————— Reminders ————— */}
      <FeatureSplit
        id="reminders"
        eyebrow="Reminders"
        title="A reminder that survives a busy day."
        body="Set a time on a task or on a note. When it passes, the row turns red instead of quietly disappearing — and the next time you open onWard, what fell due is waiting for you in one modal."
        points={[
          "Times on tasks and on notes, shared across your free allowance",
          "A passed reminder shows red, with a tap to silence it alone",
          "Snooze it ten minutes, silence it, or mark it done from one modal",
          "Anything that fell due while you were away catches you up",
        ]}
        reverse
        caption="A missed task reminder, and the modal that catches up on it."
        visual={
          <LimePanel>
            <ReminderScreen />
          </LimePanel>
        }
      />

      {/* ————— Notes ————— */}
      <FeatureSplit
        id="notes"
        eyebrow="Thinking space"
        title="Notes that turn into something."
        body="Write the messy version first. Notes keep their own boxes, so a list you ticked is a list that counts as progress — and the good ones can become an onWard later."
        points={[
          "Grouped by the day you wrote them, pinned ones kept close",
          "Tick lines inside the note, in place, without opening it",
          "Turn a note into an onWard, or export it as Markdown",
          "A reminder on a note asks for one nudge, not a whole task",
        ]}
        caption="Your notes: a pinned card, tickable lines and the reminder pill."
        visual={
          <LimePanel>
            <NotesScreen />
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
              Tasks and notes are the daily part. onWards are the proof. Insights
              read them back to you, and the portfolio is what someone else can
              see.
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
        body="Insights counts steps, not hours in a chair. The streak is only the days you turned up, and the heatmap keeps six months of them in one square each."
        points={[
          "Steps across tasks, notes and onWards, per week or month",
          "A six-month heatmap — every square a day you showed up",
          "Skills showing up, ranked by the onWards that used them",
          "A leaderboard ranked by what you logged, first names only",
        ]}
        caption="Insights: the step bars, the skills the work shows, the streak."
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
            Your role shapes the portfolio page and what onWard suggests you log.
            None of these nine are a box you have to stay in — add your own.
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
              Tasks and notes are unlimited on every plan. Free carries three
              onWards a month; Pro removes the ceiling when your record outgrows
              it.
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
