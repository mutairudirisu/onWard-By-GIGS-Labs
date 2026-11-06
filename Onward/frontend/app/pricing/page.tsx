import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { ComparisonTable, PricingBlock } from "@/components/pricing-plans";

export const metadata: Metadata = {
  title: "Pricing — onWard by GIGS Labs",
  description:
    "Start free and upgrade when the limits start to bite. onWard pricing for students, job seekers, freelancers and working people who log their growth.",
};

/* Every answer here describes behaviour that exists in Onward/app today.
 * When a claim needs a feature that is not shipped, the claim goes. */
const FAQS = [
  {
    q: "What exactly is an onWard?",
    a: "An onWard is a piece of finished work you log on purpose — the fix you shipped, the project you submitted, the skill you practised. It carries its own date, tags and (on Pro) the evidence behind it, and it is what your portfolio page is built out of.",
  },
  {
    q: "Is my timeline private?",
    a: "Yes, and there is nothing to publish by accident. Every onWard you log stays in your account. The feed is separate: it shows only what you deliberately write as a post, plus the name you joined with and your initials, and deleting the post takes its files and comments with it. There is no public profile or shareable portfolio page: the portfolio is a page inside your account that downloads as a PDF when you decide to hand it to someone.",
  },
  {
    q: "What happens when I hit a Free limit?",
    a: "The app counts them for you: three onWards a month, shown as \"2 of 3 free onWards used this month\" while you are still writing. When you reach the last one it asks before it stops you, and the half-written entry stays exactly where you left it.",
  },
  {
    q: "What does Free leave out?",
    a: "Two things: how many onWards you can log in a month, and whether you can attach evidence — a link, file or image — to one. The dated record, the streak, the heatmap, insights, the portfolio page and its PDF, dictation and the dark theme are on both plans.",
  },
  {
    q: "Does the app work offline?",
    a: "It installs from the browser as an app, and the shell is cached, so the screens still open with no signal. Saving needs a connection — your logs go to your own account, not to a queue on the device.",
  },
  {
    q: "Do you offer a student discount?",
    a: "Half price while you study. Set your role to Student in the app and Pro drops to ₦750/mo (₦600 billed yearly). We do not ask for a student ID; the rate stays with you as long as your role says Student.",
  },
  {
    q: "How does billing work?",
    a: "You change plans from the upgrade screen inside the app. Card checkout is not wired up yet, so nothing is charged automatically today — the numbers on this page are the ones the app already shows, and they are what billing will use.",
  },
];

export default function Pricing() {
  return (
    <main>
      <section className="relative overflow-hidden bg-night pb-28 pt-[104px] text-paper sm:pt-[132px]">
        <Starfield />
        <div className="container-x relative text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-4 py-1.5 text-[12.5px] font-semibold text-paper/85">
            Pricing
          </span>
          <h1 className="h-page mx-auto mt-6 max-w-3xl">
            Two plans. Both keep your history.
          </h1>
          <p className="lead mx-auto mt-5 max-w-xl text-paper/60">
            Free is a working app, not a trial. Upgrade when the onWard cap or
            the evidence cap starts deciding what you can log.
          </p>
          <PricingBlock />
        </div>
      </section>

      {/* ————— Line by line ————— */}
      <section className="bg-mist py-20 lg:py-24">
        <div className="container-x">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="eyebrow">Line by line</p>
            <h2 className="h2 mt-4">What each plan actually carries.</h2>
            <p className="lead mx-auto mt-4">
              These are the limits the app enforces, not a wish list. The rows
              that read the same on both plans are the ones we do not gate.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <ComparisonTable />
          </div>
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
        <div className="relative overflow-hidden rounded-[36px] bg-night px-6 py-14 text-center text-paper sm:px-8 sm:py-16">
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
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-[14px] font-semibold text-paper/85 transition hover:border-lime hover:text-lime"
              >
                <MessageCircle className="h-4 w-4" />
                Ask GIGS Labs a question
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
