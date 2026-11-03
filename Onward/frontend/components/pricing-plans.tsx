"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { APP_URL, SIGNUP_URL } from "@/lib/site";

/* Mirrors PLAN_LIMITS / PRO_PRICING in Onward/app/lib/data.ts — the numbers the
 * app actually enforces. Things the app does not enforce yet (share links,
 * verified skills, streak forgiveness) stay off this page until they do. */
const TIERS = [
  {
    id: "free",
    name: "Free",
    tagline: "For the habit, before the record.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    href: SIGNUP_URL,
    featured: false,
    features: [
      "Unlimited tasks, notes and steps",
      "3 onWards a month",
      "Reminders on 3 tasks or notes",
      "Portfolio page and PDF download",
      "Weekly insights, dark theme, installs as an app",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For people building a track record.",
    monthly: 1500,
    yearly: 1200,
    cta: "Go Pro",
    href: APP_URL,
    featured: true,
    features: [
      "Everything in Free",
      "Unlimited onWards, unlimited reminders",
      "Evidence on every onWard — link, file or image",
      "Full insights history instead of this week only",
      "Half price while your role says Student",
    ],
  },
];

const ROWS: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Tasks & notes", free: "Unlimited", pro: "Unlimited" },
  { label: "onWards per month", free: "3", pro: "Unlimited" },
  { label: "Reminders (tasks + notes)", free: "3", pro: "Unlimited" },
  { label: "Evidence per onWard", free: "None", pro: "Unlimited" },
  { label: "Insights", free: "This week", pro: "Full history" },
  { label: "Portfolio page & PDF", free: true, pro: true },
  { label: "Voice dictation", free: true, pro: true },
  { label: "Dark theme", free: true, pro: true },
  { label: "Installable PWA", free: true, pro: true },
  { label: "Reminders that reach you off-device", free: false, pro: "In progress" },
];

function Cell({ value, tone }: { value: string | boolean; tone: "free" | "pro" }) {
  const muted = tone === "free" ? "text-ink/70" : "text-ink/70";
  if (value === true) {
    return (
      <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
        <Check className="h-4 w-4 text-lime-deep" strokeWidth={2.6} /> Yes
      </span>
    );
  }
  if (value === false) {
    return (
      <span className={`flex items-center gap-1.5 text-[13.5px] ${muted}`}>
        <Minus className="h-4 w-4 text-faint" strokeWidth={2.4} /> No
      </span>
    );
  }
  return <span className="text-[13.5px] font-medium text-ink">{value}</span>;
}

export function PricingBlock() {
  const [yearly, setYearly] = useState(true);

  return (
    <>
      <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
        <span
          className={`text-[14px] font-semibold ${yearly ? "text-paper/50" : "text-paper"}`}
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
          className={`text-[14px] font-semibold ${yearly ? "text-paper" : "text-paper/50"}`}
        >
          Yearly
        </span>
        <span className="rounded-full bg-lime px-3 py-1 text-[11px] font-bold text-ink">
          Two months free
        </span>
      </div>

      {/* The parent section already carries container-x; nesting it here made the
          cards narrower than every other section on the page. */}
      <div className="relative z-20 mx-auto mt-14 grid max-w-3xl gap-6 text-left sm:grid-cols-2">
        {TIERS.map((t) => {
          const price = yearly ? t.yearly : t.monthly;
          return (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-[28px] p-7 sm:p-8 ${
                t.featured
                  ? "border border-lime/40 bg-paper text-ink shadow-lift"
                  : "border border-paper/15 bg-paper/5 text-paper"
              }`}
            >
              {t.featured ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-lime px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-ink">
                  Most people start here
                </span>
              ) : null}
              <p
                className={`text-[17px] font-bold tracking-tight ${
                  t.featured ? "text-ink" : "text-paper"
                }`}
              >
                {t.name}
              </p>
              <p
                className={`mt-1.5 text-[13.5px] ${
                  t.featured ? "text-muted" : "text-paper/55"
                }`}
              >
                {t.tagline}
              </p>
              <div className="mt-6 flex flex-wrap items-end gap-x-1.5 gap-y-1">
                <span
                  className={`text-[36px] font-bold leading-none tracking-tight ${
                    t.featured ? "text-ink" : "text-paper"
                  }`}
                >
                  ₦{price.toLocaleString("en-NG")}
                </span>
                <span
                  className={`pb-1 text-[13px] font-medium ${
                    t.featured ? "text-muted" : "text-paper/55"
                  }`}
                >
                  / month{yearly && price > 0 ? ", billed yearly" : ""}
                </span>
                {t.featured && yearly ? (
                  <span className="w-full pt-1 text-[12px] font-medium text-muted">
                    ₦{(price * 12).toLocaleString("en-NG")} a year · students pay
                    ₦7,200
                  </span>
                ) : null}
              </div>
              <Link
                href={t.href}
                className={`mt-7 ${
                  t.featured
                    ? "btn-lime w-full"
                    : "w-full border border-paper/25 text-paper hover:border-lime hover:text-lime"
                } inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition`}
              >
                {t.cta}
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </Link>
              <ul className="mt-8 space-y-3.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-3 text-[13.5px] font-medium ${
                      t.featured ? "text-ink/80" : "text-paper/80"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        t.featured ? "bg-lime text-ink" : "bg-lime/20 text-lime"
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

      <p className="tiny relative z-20 mx-auto mt-8 max-w-2xl text-center text-paper/45">
        Prices in Nigerian Naira (₦). Set your role to Student in the app and Pro
        drops to ₦750/mo (₦600 billed yearly) for as long as you are studying —
        same plan, no student ID. Cancel from the app; your tasks, notes and
        onWards stay yours and the portfolio page still downloads.
      </p>
    </>
  );
}

export function ComparisonTable() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-paper">
      <div className="grid grid-cols-[1.6fr_1fr_1fr] border-b border-line bg-mist text-left">
        <p className="px-4 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-muted sm:px-6">
          What you get
        </p>
        <p className="px-3 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-muted sm:px-4">
          Free
        </p>
        <p className="px-3 py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-ink sm:px-4">
          Pro
        </p>
      </div>
      {ROWS.map((r) => (
        <div
          key={r.label}
          className="grid grid-cols-[1.6fr_1fr_1fr] items-start border-b border-line/70 last:border-0"
        >
          <p className="px-4 py-4 text-[13.5px] font-semibold text-ink sm:px-6">
            {r.label}
          </p>
          <div className="px-3 py-4 sm:px-4">
            <Cell value={r.free} tone="free" />
          </div>
          <div className="px-3 py-4 sm:px-4">
            <Cell value={r.pro} tone="pro" />
          </div>
        </div>
      ))}
    </div>
  );
}
