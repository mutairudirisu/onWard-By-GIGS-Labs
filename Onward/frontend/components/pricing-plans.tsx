"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

type Tier = {
  id: string;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  cta: string;
  featured?: boolean;
  comingSoon?: boolean;
  features: string[];
};

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For your first streak.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "Unlimited tasks and notes",
      "3 onWards per month",
      "Today view + weekly insights",
      "Offline PWA on any device",
    ],
  },
  {
    id: "grow",
    name: "Grow",
    tagline: "For people building a track record.",
    monthly: 1500,
    yearly: 1200,
    cta: "Get Grow",
    featured: true,
    features: [
      "Everything in Free",
      "Unlimited onWards + milestones",
      "Shareable portfolio link with analytics",
      "Verified skill snapshots",
      "Streak forgiveness & smart nudges",
    ],
  },
  {
    id: "teams",
    name: "Teams",
    tagline: "For managers and squads that grow together.",
    monthly: 3000,
    yearly: 2500,
    cta: "Coming soon",
    comingSoon: true,
    features: [
      "Everything in Grow",
      "Shared team onWard spaces",
      "Weekly momentum digest per teammate",
      "Celebrations wired to your chat tool",
      "Admin, roles & SSO",
    ],
  },
];

export function PricingBlock() {
  const [yearly, setYearly] = useState(true);

  return (
    <>
      <div className="relative z-10 mt-10 flex items-center justify-center gap-4">
        <span
          className={`text-[14px] font-semibold ${
            yearly ? "text-paper/50" : "text-paper"
          }`}
        >
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle yearly billing"
          onClick={() => setYearly((v) => !v)}
          className={`relative h-7 rounded-full transition-colors ${
            yearly ? "bg-lime-deep" : "bg-paper/25"
          }`}
          style={{ width: 52 }}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-paper shadow transition-all ${
              yearly ? "left-[28px]" : "left-1"
            }`}
          />
        </button>
        <span
          className={`text-[14px] font-semibold ${
            yearly ? "text-paper" : "text-paper/50"
          }`}
        >
          Yearly
        </span>
        <span className="rounded-full bg-lime px-3 py-1 text-[11px] font-bold text-ink">
          2 months free
        </span>
      </div>

      <div className="container-x relative z-20 -mt-4 text-left">
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {TIERS.map((t) => {
          const price = yearly ? t.yearly : t.monthly;
          return (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-[28px] p-8 ${
                t.featured
                  ? "bg-night text-paper shadow-lift"
                  : "border border-line bg-paper shadow-card"
              }`}
            >
              {t.featured ? (
                <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-lime px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink">
                  <Sparkles className="h-3 w-3" strokeWidth={2.6} />
                  Most popular
                </span>
              ) : null}
              {t.comingSoon ? (
                <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-paper">
                  Coming soon
                </span>
              ) : null}
              <p
                className={`text-[17px] font-bold tracking-tight ${
                  t.featured ? "text-paper" : "text-ink"
                }`}
              >
                {t.name}
              </p>
              <p
                className={`mt-1.5 text-[13.5px] ${
                  t.featured ? "text-paper/55" : "text-muted"
                }`}
              >
                {t.tagline}
              </p>
              <div className="mt-6 flex items-end gap-1.5">
                <span
                  className={`text-[40px] font-bold leading-none tracking-tight ${
                    t.featured ? "text-paper" : "text-ink"
                  }`}
                >
                  ₦{price.toLocaleString("en-NG")}
                </span>
                <span
                  className={`pb-1 text-[13px] font-medium ${
                    t.featured ? "text-paper/55" : "text-muted"
                  }`}
                >
                  / month{yearly && price > 0 ? ", billed yearly" : ""}
                </span>
              </div>
              {t.comingSoon ? (
                <span
                  className={`mt-7 inline-flex w-full cursor-default items-center justify-center gap-2 rounded-full border border-dashed px-6 py-3 text-[14px] font-semibold ${
                    t.featured
                      ? "border-paper/25 text-paper/60"
                      : "border-line text-muted"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  {t.cta}
                </span>
              ) : (
                <Link
                  href="https://pwa.onward.app"
                  className={`mt-7 ${
                    t.featured
                      ? "btn-lime w-full"
                      : "btn-ghost w-full hover:border-ink"
                  }`}
                >
                  {t.cta}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </Link>
              )}
              <ul className="mt-8 space-y-3.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-3 text-[13.5px] font-medium ${
                      t.featured ? "text-paper/80" : "text-ink/80"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        t.featured ? "bg-lime text-ink" : "bg-lime-soft text-lime-deep"
                      }`}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        </div>
        <p className="tiny mt-8 text-center">
          Prices in Nigerian Naira (₦). Cancel anytime — your timeline and portfolio stay
          exportable forever, even on Free.
        </p>
      </div>
    </>
  );
}
