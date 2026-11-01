import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sprout, Star } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { CreateSheetMock, FeatureSplit, LimePanel } from "@/components/sections";
import { GoalsMock, ShareCardMock } from "@/components/mocks";
import { RadialShowcase } from "@/components/radial-showcase";
import { AudiencesTabs } from "@/components/audiences-tabs";
import { FeatureAccordion } from "@/components/feature-accordion";
import { StepsShowcase } from "@/components/steps-showcase";
import { StudentShowcase } from "@/components/student-showcase";
import { Testimonials } from "@/components/testimonials";
import { APP_URL } from "@/lib/site";

const LOGOS = [
  { abbr: "Ff", name: "Fieldworth" },
  { abbr: "Kk", name: "Kano Studio" },
  { abbr: "Nr", name: "NORTHQ" },
  { abbr: "Wv", name: "Wavehouse" },
  { abbr: "Zz", name: "Zigzagg" },
  { abbr: "Bm", name: "Bloomal" },
];

export default function Home() {
  return (
    <main>
      {/* ————— Hero ————— */}
      <section className="relative overflow-hidden bg-night pb-10 pt-[110px] text-paper sm:pt-[140px] lg:pt-[150px]">
        <Starfield />
        <span className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-lime/10 blur-3xl" />
        <div className="container-x relative">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-4 py-1.5 text-[12.5px] font-semibold text-paper/85 backdrop-blur">
              <span className="flex -space-x-1.5">
                {["A", "K", "T"].map((c) => (
                  <span
                    key={c}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-night bg-mist text-[10px] font-bold text-ink"
                  >
                    {c}
                  </span>
                ))}
              </span>
              Join 2k+ members growing with onWard
            </span>
            <h1 className="h-display mt-7">
              Your growth,{" "}
              <span className="relative inline-block">
                documented
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 220 12"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M4 9C60 3 160 3 216 8"
                    stroke="#C9F24E"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-paper/65 sm:text-[18px]">
              Plan your day. Capture your wins. Build a story of your work
              you&apos;re proud to share.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/pricing" className="btn-light">
                Start free
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-[14px] font-semibold text-paper/85 transition hover:border-lime hover:text-lime"
              >
                See how it works
              </a>
            </div>
            <p className="tiny mt-5 text-paper/40">
              Free forever plan · No credit card · Works offline as a PWA
            </p>
          </div>

          {/* dark rounded panel with product screenshot */}
          <div className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-[36px] border border-paper/10 bg-dark px-6 pt-10 sm:px-12">
            <span className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-lime" />
            <span className="absolute right-8 top-8 hidden items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-[11px] font-semibold text-paper/70 sm:flex">
              <Sprout className="h-3.5 w-3.5 text-lime" strokeWidth={2.4} />
              Today view
            </span>
            <div className="relative mx-auto mt-6 w-full max-w-[280px] sm:max-w-[340px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/app-today.png"
                alt="onWard Today screen showing tasks, notes and momentum"
                className="w-full rounded-t-[24px] border-x border-t border-paper/10 shadow-lift"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ————— Logo row (infinite marquee) ————— */}
      <section className="py-16">
        <p className="text-center text-[12px] font-bold uppercase tracking-[0.18em] text-faint">
          Trusted by people growing at
        </p>
        <div className="marquee mt-9 overflow-hidden">
          <div className="marquee-track">
            {[...LOGOS, ...LOGOS].map((l, i) => (
              <span
                key={`${l.abbr}-${i}`}
                className="flex shrink-0 items-center gap-2.5 pr-12 text-muted"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-[12px] font-bold text-ink/60">
                  {l.abbr}
                </span>
                <span className="whitespace-nowrap text-[15px] font-bold tracking-tight text-ink/45">
                  {l.name}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Feature 1 ————— */}
      <FeatureSplit
        id="features"
        eyebrow="Capture the loop"
        title="One tap to log a task, a note, or an onWard."
        body="The plus button opens a single create sheet, so momentum never waits for the right app. Tasks keep today moving, notes keep the reasoning, onWards keep the proof."
        points={[
          "Task, note and onWard creation from anywhere",
          "Offline-first — the PWA works on the train",
          "Every log lands on your timeline, tagged and dated",
        ]}
        visual={
          <LimePanel>
            <CreateSheetMock />
          </LimePanel>
        }
      />

      {/* ————— Feature accordion (hover to expand) ————— */}
      <section id="features-scroll" className="bg-mist py-20 lg:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Built to keep you going</p>
            <h2 className="h2 mt-4">The quiet work behind every onWard.</h2>
            <p className="lead mt-5">
              Hover through the features that turn busy days into a record you
              can be proud of.
            </p>
          </div>
        </div>
        <div className="container-x mt-14">
          <FeatureAccordion />
        </div>
      </section>

      {/* ————— Steps showcase (scroll-synced) ————— */}
      <StepsShowcase />

      {/* ————— Feature 2 ————— */}
      <FeatureSplit
        id="portfolio"
        eyebrow="Make it visible"
        title="Turn private effort into a portfolio employers open."
        body="onWards aggregate into milestones, milestones build your shareable link. Send one URL instead of another CV that nobody reads."
        points={[
          "Shareable portfolio link with verified milestones",
          "View analytics so you know who is looking",
          "Export a skill snapshot for applications",
        ]}
        reverse
        visual={
          <LimePanel>
            <ShareCardMock />
          </LimePanel>
        }
      />

      {/* ————— Radial showcase ————— */}
      <section className="bg-mist py-20 lg:py-28">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Everything connects</p>
            <h2 className="h2 mt-4">We keep your momentum up and running.</h2>
            <p className="lead mt-5">
              Tasks, notes, streaks, skills and wins orbit one thing — the
              onWard timeline that makes your growth impossible to deny.
            </p>
          </div>
          <div className="mt-14">
            <RadialShowcase />
          </div>
        </div>
      </section>

      {/* ————— Feature 3 (goals/live) ————— */}
      <FeatureSplit
        id="insights"
        eyebrow="Stay honest"
        title="Goals you can see updating live, not yearly."
        body="Weekly goals, streaks and insights sit beside the work itself. onWard nudges before you spiral, and celebrates before you quit."
        points={[
          "Live weekly goal progress with per-task counts",
          "Streaks that forgive one bad day, not a bad month",
          "Insights that separate busy from moving forward",
        ]}
        reverse
        visual={
          <LimePanel>
            <GoalsMock />
          </LimePanel>
        }
      />

      {/* ————— Audiences tabs ————— */}
      <section id="audiences" className="container-x py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Built for momentum</p>
          <h2 className="h2 mt-4">onWard is built with you in mind.</h2>
          <p className="lead mt-5">
            Pick your lane — the same timeline works for every kind of growth.
          </p>
        </div>
        <div className="mt-12">
          <AudiencesTabs />
        </div>
      </section>

      {/* ————— Student showcase ————— */}
      <StudentShowcase />

      {/* ————— Testimonials ————— */}
      <Testimonials />

      {/* ————— CTA band ————— */}
      <section className="container-x pb-24">
        <div className="relative overflow-hidden rounded-[36px] bg-night px-8 py-16 text-center text-paper sm:py-20">
          <Starfield />
          <span className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime/15 blur-2xl" />
          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-ink">
              <Star className="h-3.5 w-3.5" strokeWidth={2.6} />
              Your next onWard starts today
            </span>
            <h2 className="h2 mt-6">Stop documenting work. Start documenting growth.</h2>
            <p className="lead mt-4 text-paper/60">
              Free forever for your first three onWards. Upgrade when your
              momentum outgrows the plan, not before.
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
