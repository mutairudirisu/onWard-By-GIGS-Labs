"use client";

import { useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  Briefcase,
  ChevronRight,
  Clock,
  Flame,
  Mail,
  Megaphone,
  Share2,
  Sparkles,
  Trophy,
  Wand2,
} from "lucide-react";

type Feature = {
  title: string;
  body: string;
  Icon: typeof Bell;
  mock: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: "Nudges",
    body: "Forget to log a win? A gentle reminder at a time you choose — while the moment is still fresh.",
    Icon: Bell,
    mock: (
      <div className="w-full max-w-[340px] space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-lift">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-paper">
                <Bell className="h-3.5 w-3.5" strokeWidth={2.4} />
              </span>
              <span className="text-[12px] font-bold text-ink">onWard</span>
            </span>
            <span className="text-[10px] font-semibold text-muted">18:00</span>
          </div>
          <p className="mt-2.5 text-[12px] font-medium leading-snug text-ink">
            What moved forward today, however small? Log it before you log off.
          </p>
        </div>
        <div className="ml-6 rounded-2xl bg-mist p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime text-ink">
              <Flame className="h-3.5 w-3.5" strokeWidth={2.4} />
            </span>
            <span className="text-[11px] font-bold text-ink/70">Streak at stake</span>
          </div>
          <p className="mt-2 text-[11px] font-medium leading-snug text-muted">
            One more onWard keeps your 16-day streak alive.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Insights",
    body: "See what your record actually says — your strongest skills, and the gaps worth filling before your next review.",
    Icon: BarChart3,
    mock: (
      <div className="w-full max-w-[360px] rounded-2xl bg-paper p-5 shadow-lift">
        <p className="text-[12px] font-bold text-ink">Evidence for your goals</p>
        <p className="mt-0.5 text-[10px] text-muted">Prepare for reviews</p>
        <div className="mt-4 space-y-3">
          {[
            ["Delivery", "Strong", 8],
            ["Problem solving", "Light", 3],
            ["Collaboration", "Strong", 7],
            ["Learning", "Light", 2],
          ].map(([label, verdict, filled]) => (
            <div key={label as string}>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-ink">{label}</span>
                <span
                  className={`text-[9.5px] font-bold ${
                    verdict === "Strong" ? "text-lime-deep" : "text-[#C08A2D]"
                  }`}
                >
                  {verdict}
                </span>
              </div>
              <div className="mt-1.5 flex gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < (filled as number)
                        ? verdict === "Strong"
                          ? "bg-[#3E5C34]"
                          : "bg-[#C08A2D]"
                        : "bg-mist"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Time Capsule",
    body: "Write to future you. Log a note today, pick a date, and onWard sends it back when you forget how far you have come.",
    Icon: Clock,
    mock: (
      <div className="w-full max-w-[360px] rounded-2xl bg-paper p-5 shadow-lift">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-soft">
              <Clock className="h-4 w-4 text-lime-deep" strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-[12px] font-bold text-ink">Time Capsule</span>
              <span className="block text-[9.5px] font-medium text-muted">
                Arrives 20 April 2027
              </span>
            </span>
          </span>
          <span className="relative h-6 w-11 rounded-full bg-lime-deep">
            <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-paper shadow" />
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["3 months", "6 months", "1 year", "Pick a date"].map((p, i) => (
            <span
              key={p}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
                i === 1
                  ? "border-lime-deep bg-lime-pale text-ink"
                  : "border-line bg-paper text-muted"
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Build",
    body: "Something coming up? Tell onWard what you need and it drafts it from your real record — review, promo case, interview prep and more.",
    Icon: Wand2,
    mock: (
      <div className="w-full max-w-[360px] rounded-2xl bg-paper p-2 shadow-lift">
        {[
          { Icon: Share2, label: "Social post", meta: "Draft it in your voice.", tint: "bg-lime-soft text-lime-deep" },
          { Icon: Briefcase, label: "Promo case", meta: "Your onWards, mapped to the ask.", tint: "bg-[#E7E2F5] text-[#6D5AA8]" },
          { Icon: BookOpenCheck, label: "Performance review", meta: "Quarter summary, ready.", tint: "bg-[#DDEAE2] text-[#3E5C34]" },
          { Icon: Megaphone, label: "Cold outreach", meta: "Evidence, not adjectives.", tint: "bg-[#F3E3CF] text-[#B07A2E]" },
          { Icon: Trophy, label: "Skill snapshot", meta: "One-page career summary.", tint: "bg-mist text-ink/60" },
        ].map(({ Icon, label, meta, tint }, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-3 py-2.5 ${
              i < 4 ? "border-b border-line/70" : ""
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}>
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-bold text-ink">{label}</span>
              <span className="block truncate text-[9.5px] font-medium text-muted">
                {meta}
              </span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-faint" />
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Share",
    body: "One link, always current. Send your onWard portfolio instead of a CV that goes stale the day it is written.",
    Icon: Share2,
    mock: (
      <div className="w-full max-w-[360px] space-y-3">
        <div className="rounded-2xl bg-paper p-4 shadow-lift">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-[10px] font-bold text-ink">
              MC
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-bold text-ink">onWard.link/maya</span>
              <span className="block text-[9.5px] font-medium text-muted">
                Updated 2 hours ago
              </span>
            </span>
            <span className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[9px] font-bold text-paper">
              <Share2 className="h-2.5 w-2.5" strokeWidth={2.6} />
              Copy
            </span>
          </div>
        </div>
        <div className="ml-6 flex items-center gap-2.5 rounded-2xl bg-paper/70 px-4 py-3">
          <Sparkles className="h-4 w-4 text-lime-deep" strokeWidth={2.2} />
          <span className="text-[10.5px] font-semibold text-ink/70">
            Viewed by 3 recruiters this week
          </span>
        </div>
        <div className="mr-4 flex items-center gap-2.5 rounded-2xl bg-mist px-4 py-3">
          <Mail className="h-4 w-4 text-muted" strokeWidth={2.2} />
          <span className="text-[10.5px] font-medium text-muted">
            “Loved your timeline — can we talk?”
          </span>
        </div>
      </div>
    ),
  },
];

export function FeatureAccordion() {
  const [active, setActive] = useState(0);

  return (
    <div>
      {/* Desktop / tablet: horizontal hover-to-expand accordion */}
      <div className="hidden h-[520px] gap-3 md:flex lg:h-[560px] lg:gap-4">
        {FEATURES.map((f, i) => {
          const isActive = i === active;
          const { Icon } = f;
          return (
            <article
              key={f.title}
              role="button"
              tabIndex={0}
              aria-expanded={isActive}
              aria-label={`${f.title}: ${f.body}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActive(i);
                }
              }}
              className={`relative cursor-pointer overflow-hidden rounded-[28px] bg-paper transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive
                  ? "flex-[6] shadow-lift ring-1 ring-lime-deep/20"
                  : "flex-[1] shadow-card hover:bg-paper"
              }`}
            >
              {/* Collapsed: icon + vertical title */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center gap-5 transition-opacity duration-200 ${
                  isActive ? "pointer-events-none opacity-0" : "opacity-100 delay-200"
                }`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime text-ink">
                  <Icon className="h-5 w-5" strokeWidth={2.3} />
                </span>
                <span className="whitespace-nowrap text-[15px] font-bold tracking-tight text-ink [writing-mode:vertical-rl] rotate-180">
                  {f.title}
                </span>
              </div>

              {/* Expanded: mock + title + body */}
              <div
                className={`absolute inset-0 flex flex-col gap-6 p-7 transition-opacity duration-300 lg:p-9 ${
                  isActive ? "opacity-100 delay-150" : "pointer-events-none opacity-0"
                }`}
              >
                <div className="flex flex-1 items-center justify-center overflow-hidden">
                  {f.mock}
                </div>
                <div>
                  <h3 className="text-[19px] font-bold tracking-tight text-ink lg:text-[21px]">
                    {f.title}
                  </h3>
                  <p className="mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-ink/60 lg:text-[14.5px]">
                    {f.body}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Mobile: stacked, always expanded */}
      <div className="space-y-4 md:hidden">
        {FEATURES.map((f) => {
          const { Icon } = f;
          return (
            <div key={f.title} className="rounded-[26px] bg-paper p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-ink">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.3} />
                </span>
                <h3 className="text-[18px] font-bold tracking-tight text-ink">{f.title}</h3>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink/60">{f.body}</p>
              <div className="mt-5 flex justify-center">{f.mock}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
