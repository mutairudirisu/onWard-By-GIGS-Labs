import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  Compass,
  Laptop,
  Mail,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { APP_URL, emailFor, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Careers — GIGS Labs",
  description:
    "GIGS Labs is not hiring yet — open roles are coming soon. See how we work, the roles we plan to open, and be the first to hear about them.",
};

const HOW = [
  {
    icon: Compass,
    title: "Own outcomes, not tickets",
    body: "Small team means you touch the whole thing — the why, the design, the code, the support reply. Nothing is “someone else’s problem.”",
  },
  {
    icon: CalendarClock,
    title: "Sustainable pace",
    body: "We ship carefully, not frantically. We would rather rest and review than burn a founding team out by month six.",
  },
  {
    icon: Laptop,
    title: "Remote-first, async by default",
    body: "Written-first work, few meetings, deep-focus blocks. We hire for judgment and communication over hours logged.",
  },
];

const TEASERS = [
  ["Founding Full-stack Engineer", "React, Next.js, TypeScript. Own the app end to end.", "Engineering"],
  ["Product Designer", "The whole feel of onWard — flows, empty states, delight.", "Design"],
  ["Growth & Community", "Tell our story, learn in public, talk to real users.", "Growth"],
  ["Founding Operations", "Keep a young company running smoothly.", "Ops"],
];

const PILLARS = [
  ["Equity & ownership", "Early people share in what we build together."],
  ["Real learning", "A small team is the fastest way to grow your craft."],
  ["Fair, transparent pay", "Priced for where you live, reviewed as we grow."],
  ["Flexibility", "Location-aware hours. We hire humans, not timezones."],
];

export default function Careers() {
  return (
    <main>
      <PageHero
        eyebrow="Careers"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-1.5 text-[12.5px] font-bold text-ink">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} /> Coming soon
          </span>
        }
        title="We are not hiring yet — but watch this space."
        subtitle="GIGS Labs is deliberately small while onWard finds its feet. When we open our first roles, they will live here. Here is what working with us looks like."
      />

      {/* ————— Coming soon banner ————— */}
      <section className="container-x pt-16 lg:pt-20">
        <div className="relative overflow-hidden rounded-[32px] border border-dashed border-lime-deep/50 bg-lime-pale px-8 py-12 text-center">
          <span className="absolute right-6 top-6 rounded-full bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-paper">
            Coming soon
          </span>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime text-ink">
            <BellRing className="h-7 w-7" strokeWidth={2.2} />
          </span>
          <h2 className="h2 mx-auto mt-6 max-w-xl text-[26px] sm:text-[34px]">
            No open roles right now.
          </h2>
          <p className="lead mx-auto mt-4 max-w-lg text-[15px]">
            We are still a founding team of a few people. The moment that
            changes, this page fills up. Want first notice? Leave your email with
            us.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={mailto("careers", "Notify me about GIGS Labs roles")}
              className="btn-dark"
            >
              <Mail className="h-4 w-4" /> Notify me when roles open
            </a>
            <Link href="/about" className="btn-ghost">
              Why GIGS Labs is worth waiting for
            </Link>
          </div>
        </div>
      </section>

      {/* ————— How we work ————— */}
      <section className="container-x py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How we work</p>
          <h2 className="h2 mt-4">The shape of a day at a young studio.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {HOW.map((h) => (
            <div
              key={h.title}
              className="rounded-[24px] border border-line bg-paper p-6 shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-soft text-lime-deep">
                <h.icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <h3 className="h3 mt-5 text-[17px]">{h.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
                {h.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ————— Roles we plan to open ————— */}
      <section className="bg-mist py-16 lg:py-24">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Future openings</p>
              <h2 className="h2 mt-4 max-w-md">Roles we expect to open first.</h2>
            </div>
            <p className="tiny max-w-xs text-right">
              A preview, not a promise — titles and timing will shift as we grow.
            </p>
          </div>
          <div className="mt-10 space-y-3">
            {TEASERS.map(([role, blurb, team]) => (
              <div
                key={role}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[16px] font-bold text-ink">{role}</h3>
                    <span className="rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                      {team}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-muted">{blurb}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-dashed border-faint px-3 py-1.5 text-[12px] font-bold text-faint sm:self-auto">
                  <CalendarClock className="h-3.5 w-3.5" /> Coming soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— What we offer ————— */}
      <section className="container-x py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">What we offer</p>
            <h2 className="h2 mt-4 max-w-sm">
              Small team, real stakes, fair deal.
            </h2>
            <p className="lead mt-5 text-[15px]">
              We can&apos;t promise big-company perks yet. We can promise
              ownership, learning you can feel, and people who take care of each
              other.
            </p>
            <div className="mt-6 flex items-center gap-3 text-[13px] text-muted">
              <MapPin className="h-4 w-4" /> Lagos, Nigeria · Remote-first
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map(([t, b]) => (
              <div
                key={t}
                className="rounded-2xl border border-line bg-paper p-5 shadow-card"
              >
                <h3 className="text-[15px] font-bold text-ink">{t}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                  {b}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Closing CTA ————— */}
      <section className="container-x pb-24">
        <div className="flex flex-col items-center gap-5 rounded-[36px] bg-night px-8 py-14 text-center text-paper">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-ink">
            <Users className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <h2 className="h2 max-w-xl text-[26px] sm:text-[34px]">
            Not ready to apply? Start by using the product.
          </h2>
          <p className="lead mx-auto max-w-lg text-paper/60">
            The best way to catch our attention is to know onWard cold. Use it,
            break it, tell us what we should build next.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <a href={APP_URL} className="btn-lime">
              Try onWard free <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </a>
            <a
              href={mailto("careers")}
              className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-[14px] font-semibold text-paper/85 transition hover:border-lime hover:text-lime"
            >
              <Mail className="h-4 w-4" /> {emailFor("careers")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
