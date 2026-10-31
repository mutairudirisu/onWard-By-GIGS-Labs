import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Globe2,
  Heart,
  Lock,
  PenLine,
  Sprout,
  Target,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { LogoMark } from "@/components/logo";
import { APP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — GIGS Labs",
  description:
    "GIGS Labs is a small, newly founded software company behind onWard. Read our story, what we believe, and where we are heading.",
};

const VALUES = [
  {
    icon: Sprout,
    title: "Progress over perfection",
    body: "We build for the messy middle — the person who showed up today, not the one who did it flawlessly. Every decision is judged by whether it helps someone keep going.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Your history belongs to you. Nothing leaves your device unless you choose to share it, and you can take the whole story with you whenever you want.",
  },
  {
    icon: PenLine,
    title: "Craft over volume",
    body: "We are a tiny team, so we ship fewer things and finish them properly. Details you can feel are the whole point of a small studio.",
  },
  {
    icon: Globe2,
    title: "Built here, made for everywhere",
    body: "GIGS Labs is Nigerian and proud of it. onWard is priced and designed for real budgets and real days — then made to travel well.",
  },
];

const BELIEFS = [
  ["Why “onWard”?", "Because direction matters more than speed. A small step forward, repeated, is how a career actually moves."],
  ["Why document your work?", "Most of us do good work that leaves no trace — it gets buried in chat threads and forgotten by review season. onWard keeps each win with its impact and its proof, so the record builds itself while you work."],
  ["Why now?", "Because we felt it ourselves: a year of good work that nobody — including us — could point to afterwards. onWard is the fix we wanted."],
];

const CREW = [
  ["Founder & Product", "Sets the direction, writes most of the hard no’s.", "F"],
  ["Founding Engineer", "Turns the app into something that survives real use.", "E"],
  ["Design", "Owns every pixel, every empty state, every nudge.", "D"],
  ["You, maybe", "The reason we answer support emails personally.", "?"],
];

export default function About() {
  return (
    <main>
      <PageHero
        eyebrow="About GIGS Labs"
        title="A small studio with a long view on growth."
        subtitle="We are a newly founded software company with one product we care about deeply: onWard. Here is who we are, honestly."
      />

      {/* ————— Origin story ————— */}
      <section className="container-x py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="h2 mt-4 max-w-lg">
              We started with a notebook nobody read.
            </h2>
            <div className="lead mt-6 space-y-4 text-[15px]">
              <p>
                GIGS Labs began in 2026 as a two-person side project between
                friends who kept the same problem: a year of genuine effort that
                was impossible to point to afterwards. Promotions, applications,
                performance reviews — all of it asked for proof, and the proof
                lived scattered across chat logs, half-finished docs and memory.
              </p>
              <p>
                We are, to be candid, a young company. We are not a giant with a
                hundred features and a marketing machine. We are a small team
                that ships carefully, answers our own support email, and would
                rather do one thing properly than ten things loudly.
              </p>
              <p>
                onWard is the first product to come out of the lab. It started as
                an internal tool and became the thing we are proudest of — and we
                are only getting going.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/careers" className="btn-dark">
                Work with us <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
              <Link href="/contact" className="btn-ghost">
                Say hello
              </Link>
            </div>
          </div>

          {/* Fact card */}
          <aside className="h-fit rounded-[28px] border border-line bg-mist p-7 shadow-card">
            <div className="flex items-center gap-2">
              <LogoMark className="h-7 w-7" />
              <span className="text-[15px] font-bold tracking-tight text-ink">
                GIGS Labs
              </span>
            </div>
            <dl className="mt-6 space-y-4 text-[14px]">
              {[
                ["Founded", "2026"],
                ["Stage", "Early & independent"],
                ["Team size", "Small — deliberately"],
                ["Headquarters", "Lagos, Nigeria"],
                ["Product", "onWard — your growth, documented"],
                ["Contact", "hello@gigslabs.example"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-4 border-b border-line pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      {/* ————— What we believe ————— */}
      <section className="bg-mist py-16 lg:py-24">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What we believe</p>
            <h2 className="h2 mt-4">
              Four things we will not trade away.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-[24px] border border-line bg-paper p-6 shadow-card"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-soft text-lime-deep">
                  <v.icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <h3 className="h3 mt-5 text-[17px]">{v.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Origin Q&A ————— */}
      <section className="container-x py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-3">
          {BELIEFS.map(([q, a]) => (
            <div key={q}>
              <div className="flex items-center gap-2 text-lime-deep">
                <Target className="h-4 w-4" strokeWidth={2.4} />
                <h3 className="h3 text-[17px] text-ink">{q}</h3>
              </div>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ————— The crew ————— */}
      <section className="bg-night py-16 text-paper lg:py-24">
        <div className="container-x">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="eyebrow text-lime">The crew</p>
              <h2 className="h2 mt-4 text-paper">
                Small enough that you know everyone.
              </h2>
              <p className="lead mt-5 text-paper/60">
                There is no big department between you and the people who build
                onWard. When you write to us, one of these four reads it.
              </p>
              <div className="mt-8 flex items-center gap-3 text-[13px] text-paper/50">
                <Users className="h-4 w-4" />
                Remote-first · Lagos &amp; beyond
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {CREW.map(([role, blurb, initials]) => (
                <div
                  key={role}
                  className="rounded-2xl border border-paper/12 bg-paper/5 p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-[15px] font-bold text-ink">
                    {initials}
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold text-paper">{role}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-paper/55">
                    {blurb}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ————— Closing CTA ————— */}
      <section className="container-x py-16 lg:py-24">
        <div className="flex flex-col items-center gap-6 rounded-[36px] border border-line bg-lime-pale px-8 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink">
            <Heart className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <h2 className="h2 max-w-xl text-[26px] sm:text-[34px]">
            We are early. Come grow with us.
          </h2>
          <p className="lead mx-auto max-w-lg text-[15px]">
            Try onWard free, tell us what is missing, and help shape a product —
            and a company — still finding its feet.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <a href={APP_URL} className="btn-dark">
              Get onWard free
            </a>
            <Link href="/press" className="btn-ghost">
              Press kit
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
