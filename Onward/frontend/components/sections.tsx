import type { ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";

/* ————— Split feature section ————— */

export function FeatureSplit({
  id,
  eyebrow,
  title,
  body,
  points,
  visual,
  reverse = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section id={id} className="container-x py-20 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={reverse ? "lg:order-2" : ""}>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="h2 mt-4">{title}</h2>
          <p className="lead mt-5">{body}</p>
          <ul className="mt-7 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] font-medium text-ink/85">
                <span className="check">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
      </div>
    </section>
  );
}

/* ————— Light-lime panel wrapper for mock visuals ————— */

export function LimePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[32px] bg-lime-pale p-8 sm:p-10 ${className}`}
    >
      <span className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-lime/50 blur-[2px]" />
      <span className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-lime-soft" />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ————— Mock: create sheet (mirrors the PWA "+" modal) ————— */

export function CreateSheetMock() {
  const options = [
    { letter: "T", label: "New task" },
    { letter: "N", label: "New note" },
    { letter: "W", label: "New onWard" },
  ];
  const days = [
    ["M", "26"],
    ["T", "27"],
    ["W", "28"],
    ["T", "29"],
    ["F", "30"],
    ["S", "31"],
    ["S", "1"],
  ];
  const tasks = [
    { title: "Review project milestones", meta: "Work · Atlas onboarding", time: "10:00" },
    { title: "Send the onboarding summary", meta: "Work · Add results to notes", time: "15:00" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[36px] border-[6px] border-ink bg-gradient-to-b from-mist to-lime-soft shadow-lift">
      {/* Full-height Today screen behind the sheet */}
      <div className="flex h-[600px] flex-col">
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <span className="text-[12px] font-bold text-ink">9:41</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-[3px] bg-ink/70" />
            <span className="h-2.5 w-4 rounded-full bg-ink/70" />
            <span className="h-2.5 w-5 rounded-[3px] bg-ink/70" />
          </span>
        </div>
        <p className="px-5 pt-2 text-[20px] font-bold tracking-tight text-ink">Today</p>
        <p className="px-5 pb-4 pt-1 text-[12px] font-medium text-ink/50">
          Tuesday, 28 October · 3 onWards this week
        </p>

        <div className="mx-5 rounded-2xl bg-paper px-3 py-3 shadow-card">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
            This week
          </p>
          <div className="flex items-center justify-between">
            {days.map(([d, n], i) => (
              <span key={i} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-medium text-faint">{d}</span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    n === "28" ? "bg-lime text-ink" : "text-ink/60"
                  }`}
                >
                  {n}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2 px-5">
          {tasks.map((t) => (
            <div key={t.title} className="flex items-center gap-3 rounded-2xl bg-paper px-3.5 py-3 shadow-card">
              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-line" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-ink">{t.title}</span>
                <span className="block truncate text-[10px] text-muted">{t.meta}</span>
              </span>
              <span className="text-[10px] font-semibold text-muted">{t.time}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 px-5">
          <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-lime px-4 py-3 text-[12px] font-bold text-ink">
            <Plus className="h-4 w-4" strokeWidth={2.6} /> Log an onWard
          </div>
        </div>
      </div>

      {/* Dim + create sheet anchored to the bottom of the full phone */}
      <div className="absolute inset-0 flex flex-col justify-end gap-3 bg-ink/45 px-4 pb-5 backdrop-blur-[1px]">
        <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-dark p-2.5">
          {options.map((o) => (
            <div
              key={o.label}
              className="flex flex-col items-center gap-2 rounded-[16px] bg-[#2B2C24] px-2 py-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-[13px] font-bold text-ink">
                {o.letter}
              </span>
              <span className="text-[10px] font-semibold text-paper/85">{o.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 items-center justify-between rounded-full bg-paper px-2 py-1.5 shadow-lift">
            {["T", "✓", "N", "W"].map((t, i) => (
              <span
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
                  i === 0 ? "bg-[#EDEDE7] text-ink" : "text-ink/40"
                }`}
              >
                {t}
              </span>
            ))}
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime text-ink shadow-lift">
            <X className="h-5 w-5" strokeWidth={2.6} />
          </span>
        </div>
      </div>
    </div>
  );
}
