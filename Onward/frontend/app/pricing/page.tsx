import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { PricingBlock } from "@/components/pricing-plans";

export const metadata: Metadata = {
  title: "Pricing — onWard by GIGS Labs",
  description:
    "Start free and upgrade when your momentum outgrows the plan. onWard pricing for individuals, job seekers, freelancers and teams.",
};

const FAQS = [
  {
    q: "What exactly is an onWard?",
    a: "An onWard is a logged piece of growth — a finished task chain, a milestone, a skill demo — that lands on your timeline and can be bundled into your shareable portfolio. Tasks and notes stay unlimited on every plan; onWards are the proof layer.",
  },
  {
    q: "Is my timeline private?",
    a: "Yes. Everything is private by default. Only the milestones you explicitly add to a share link leave your account, and you can revoke any link in one tap.",
  },
  {
    q: "Does the app work offline?",
    a: "onWard is an offline-first PWA. Log tasks, notes and onWards on a train or a plane; everything syncs when you reconnect. The website plans here are the only part that needs a connection.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Anytime, in two taps from the app. Your Free plan keeps your full history and export rights forever — upgrading adds capability, it never holds your growth hostage.",
  },
  {
    q: "Do you offer student or wage-gap discounts?",
    a: "Grow is free for full-time students and for users enrolled in a partner programme. Verify once in the app and the discount applies for as long as you qualify.",
  },
];

export default function Pricing() {
  return (
    <main>
      <section className="relative overflow-hidden bg-night pb-32 pt-[110px] text-paper sm:pt-[140px]">
        <Starfield />
        <div className="container-x relative text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-4 py-1.5 text-[12.5px] font-semibold text-paper/85">
            Pricing
          </span>
          <h1 className="h-display mt-6 text-[36px] sm:text-[52px] lg:text-[60px]">
            Momentum has a plan for every stage.
          </h1>
          <p className="lead mx-auto mt-5 max-w-xl text-paper/60">
            Start free, stay free if that is enough. Upgrade only when your
            onWards outgrow the plan.
          </p>
          <PricingBlock />
        </div>
      </section>

      {/* ————— Testimonial strip ————— */}
      <section className="bg-mist py-20">
        <div className="container-x grid gap-6 md:grid-cols-3">
          {[
            [
              "Three interviews, one onWard link.",
              "I stopped rewriting my CV and started logging the work instead. Recruiters replied to the timeline, not the resume.",
              "Ayesha O. · Product Designer",
            ],
            [
              "The streak forgiveness is the feature.",
              "Every other tracker broke when I missed a day. onWard nudges instead of guilt-tripping, and I am at 16 days.",
              "Tobi A. · Backend Engineer",
            ],
            [
              "Our 1:1s got shorter and better.",
              "Team onWard spaces show momentum without a status meeting. I walk in with talking points, not interrogations.",
              "Dani R. · Engineering Manager",
            ],
          ].map(([title, body, who]) => (
            <figure
              key={who}
              className="rounded-[24px] border border-line bg-paper p-6 shadow-card"
            >
              <h3 className="h3 text-[16px]">{title}</h3>
              <blockquote className="lead mt-3 text-[14px]">{body}</blockquote>
              <figcaption className="mt-4 text-[12.5px] font-bold text-ink/70">
                {who}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ————— FAQ ————— */}
      <section className="container-x py-20 lg:py-24">
        <div className="mx-auto max-w-2xl">
          <p className="eyebrow text-center">Questions</p>
          <h2 className="h2 mt-4 text-center">Everything else you might ask.</h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-bold tracking-tight text-ink">
                  {f.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted transition group-open:rotate-45 group-open:border-lime-deep group-open:text-lime-deep">
                    +
                  </span>
                </summary>
                <p className="lead mt-3 max-w-xl text-[14.5px]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ————— CTA band ————— */}
      <section className="container-x pb-24">
        <div className="relative overflow-hidden rounded-[36px] bg-night px-8 py-16 text-center text-paper">
          <Starfield />
          <span className="absolute -left-16 -bottom-20 h-52 w-52 rounded-full bg-lime/15 blur-2xl" />
          <div className="relative mx-auto max-w-xl">
            <h2 className="h2 text-[26px] sm:text-[34px]">
              Still deciding? Log one onWard first.
            </h2>
            <p className="lead mt-4 text-paper/60">
              The free plan takes ninety seconds to set up and never asks for a
              card.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/#features" className="btn-lime">
                Explore features
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
              <a
                href="mailto:hello@gigslabs.example"
                className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-[14px] font-semibold text-paper/85 transition hover:border-lime hover:text-lime"
              >
                <MessageCircle className="h-4 w-4" />
                Talk to GIGS Labs
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
