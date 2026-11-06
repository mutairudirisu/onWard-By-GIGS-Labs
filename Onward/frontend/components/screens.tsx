/* Hand-built renderings of the current onWard app screens.
 *
 * These replace the October screenshots and the invented mock cards: a photo of
 * an older build and a fake "3 employers viewed this week" both promise things
 * the product does not do. Everything here is drawn from the live screens in
 * Onward/app, including the exact labels, and the only fabricated part is the
 * sample entries — which the app itself seeds. */

import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Flame,
  Link2,
  Mic,
  Plus,
  Sprout,
} from "lucide-react";


/* ————— shared chrome ————— */

export function PhoneFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[330px] overflow-hidden rounded-[34px] border-[6px] border-ink bg-paper shadow-lift ${className}`}
    >
      <div className="flex items-center justify-between px-5 pb-1 pt-3">
        <span className="text-[11px] font-bold text-ink">9:41</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-3.5 rounded-[2px] bg-ink/60" />
          <span className="h-2 w-2 rounded-full bg-ink/60" />
          <span className="h-2 w-4 rounded-[2px] bg-ink/60" />
        </span>
      </div>
      {children}
    </div>
  );
}

/** The four tabs the app actually ships. */
function TabBar({ active }: { active: string }) {
  const tabs = ["Today", "onWards", "Feed", "You"];
  return (
    <div className="mt-auto border-t border-line bg-cream px-2 pb-3 pt-2">
      <div className="flex items-center justify-between">
        {tabs.map((t) => (
          <span
            key={t}
            className={`flex flex-col items-center gap-1 rounded-full px-2.5 py-1.5 text-[9px] font-semibold ${
              t === active
                ? "bg-line text-lime-deep"
                : "text-ink/45"
            }`}
          >
            <span
              className={`h-4 w-4 rounded-[5px] ${
                t === active ? "bg-lime" : "bg-ink/20"
              }`}
            />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function DayStrip({ selected }: { selected: number }) {
  const days = [
    ["M", "26"],
    ["T", "27"],
    ["W", "28"],
    ["T", "29"],
    ["F", "30"],
    ["S", "31"],
    ["S", "1"],
  ];
  return (
    <div className="mx-4 rounded-2xl border border-line bg-paper px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
          This week
        </span>
        <CalendarDays className="h-3.5 w-3.5 text-ink/40" strokeWidth={2} />
      </div>
      <div className="flex items-center justify-between">
        {days.map(([d, n], i) => (
          <span key={i} className="flex flex-col items-center gap-1">
            <span className="text-[8.5px] font-medium text-faint">{d}</span>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                i === selected ? "bg-lime text-ink" : "text-ink/55"
              }`}
            >
              {n}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ————— Today ————— */

export function TodayScreen() {
  const rows = [
    {
      title: "A smoother start for new hires",
      impact: "40% faster onboarding · 12 new hires",
      skills: "Process design · Collaboration",
    },
    {
      title: "Made team knowledge easier to find",
      impact: "Saved an estimated 3 hours each week",
      skills: "Documentation · Communication",
    },
  ];
  return (
    <PhoneFrame>
      <div className="flex min-h-[560px] flex-col bg-gradient-to-b from-mist to-paper">
        <div className="flex items-start justify-between px-4 pt-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
              Wednesday, 28 October
            </p>
            <p className="mt-1 text-[19px] font-bold tracking-tight text-ink">
              Hi, Maya.
            </p>
          </div>
          <span className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-lime-soft text-[10px] font-bold text-ink">
              MC
            </span>
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper">
              <Bell className="h-3.5 w-3.5 text-ink/60" strokeWidth={2} />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#E5484D] ring-2 ring-paper" />
            </span>
          </span>
        </div>

        <div className="mt-3">
          <DayStrip selected={2} />
        </div>

        <div className="mt-4 flex items-center gap-3 px-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
            Logged this day
          </p>
          <span className="h-px flex-1 bg-line" />
          <p className="text-[9.5px] font-semibold text-muted underline">All onWards</p>
        </div>

        <div className="mt-2 space-y-2 px-4">
          {rows.map((r) => (
            <div
              key={r.title}
              className="flex items-start gap-2.5 rounded-2xl border border-line bg-paper px-3 py-2.5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-lime-soft">
                <Sprout className="h-3 w-3 text-inksoft" strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold tracking-tight text-ink">
                  {r.title}
                </span>
                <span className="mt-0.5 block truncate text-[9.5px] leading-[1.55] text-muted">
                  {r.impact}
                </span>
                <span className="mt-1 block truncate text-[9px] font-semibold text-inksoft">
                  {r.skills}
                </span>
              </span>
              <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-faint" />
            </div>
          ))}
        </div>

        <div className="mt-3 px-4">
          <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-lime px-4 py-2.5 text-[11px] font-bold text-ink">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.6} /> Log an onWard
          </div>
        </div>

        <div className="mx-4 mt-3 rounded-2xl border border-line bg-paper px-3.5 py-3">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            This month
          </p>
          <p className="mt-1 text-[22px] font-bold leading-none tracking-tight text-ink">2</p>
          <p className="mt-1.5 text-[9.5px] text-muted">2 of 3 free captures used.</p>
        </div>

        <div className="mx-4 mt-3 rounded-2xl bg-ink px-4 py-3.5">
          <p className="text-[10.5px] font-bold text-paper">Write it down before it blurs</p>
          <p className="mt-1 text-[9px] leading-[1.55] text-paper/60">
            The numbers and names you cannot recall next quarter are the ones a review or a CV needs.
          </p>
        </div>

        <TabBar active="Today" />
      </div>
    </PhoneFrame>
  );
}

/* ————— Insights, streaks and the heatmap ————— */

export function InsightsScreen() {
  const bars = [42, 66, 30, 80, 54, 92];
  const skills = [
    ["Documentation", 5],
    ["Collaboration", 4],
    ["Process design", 3],
  ];
  return (
    <PhoneFrame className="bg-gradient-to-b from-mist to-paper">
      <div className="flex min-h-[520px] flex-col">
        <div className="px-5 pt-2">
          <p className="text-[19px] font-bold tracking-tight text-ink">Your insights</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted">
            A calm look at how your progress is accumulating.
          </p>
        </div>
        <div className="mt-3 flex gap-1.5 px-5">
          {["This week", "This month", "All time"].map((c, i) => (
            <span
              key={c}
              className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                i === 1 ? "bg-ink text-paper" : "border border-line bg-paper text-ink/60"
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mx-5 mt-4 rounded-2xl border border-line bg-paper px-3.5 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-bold text-ink">Captures this month</p>
            <p className="text-[8.5px] font-medium text-faint">onWards logged · 30 days</p>
          </div>
          <div className="mt-3 flex h-16 items-end gap-1.5">
            {bars.map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-t-[5px] ${i === 5 ? "bg-lime" : "bg-lime-soft"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-2.5 text-[8.5px] font-medium text-muted">
            11 onWards logged in this window
          </p>
        </div>

        <div className="mx-5 mt-3 rounded-2xl border border-line bg-paper px-3.5 py-3">
          <p className="text-[10.5px] font-bold text-ink">Skills showing up</p>
          <p className="mt-0.5 text-[8.5px] font-medium text-faint">
            Based on the onWards you have logged
          </p>
          <div className="mt-3 space-y-2">
            {skills.map(([s, n]) => (
              <div key={s} className="flex items-center gap-2">
                <span className="w-24 truncate text-[9.5px] font-medium text-ink">{s}</span>
                <span className="h-1.5 flex-1 rounded-full bg-mist">
                  <span
                    className="block h-full rounded-full bg-lime-deep"
                    style={{ width: `${(n as number) * 20}%` }}
                  />
                </span>
                <span className="text-[9px] font-bold text-muted">{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-5 mt-3 flex items-center gap-3 rounded-2xl border border-line bg-paper px-3.5 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-soft">
            <Flame className="h-4 w-4 text-lime-deep" strokeWidth={2.4} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-bold text-ink">16-day streak</span>
            <span className="block text-[8.5px] font-medium text-muted">
              Last 6 months · every square is a day you showed up
            </span>
          </span>
          <span className="flex gap-[3px]">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className="flex flex-col gap-[3px]">
                {[0, 1, 2, 3, 4].map((j) => (
                  <span
                    key={j}
                    className="h-1.5 w-1.5 rounded-[2px]"
                    style={{
                      background:
                        (i + j) % 3 === 0 ? "#B4E13A" : (i + j) % 4 === 0 ? "#EDFBC6" : "#F4F6F3",
                    }}
                  />
                ))}
              </span>
            ))}
          </span>
        </div>

        <TabBar active="You" />
      </div>
    </PhoneFrame>
  );
}

/* ————— Logging an onWard ————— */

export function LogWardScreen() {
  const fields = [
    { label: "Give your work a title", value: "Cut the onboarding handoff in half", filled: true },
    { label: "Project", value: "Atlas onboarding", filled: true },
    { label: "What did you do?", value: "Wrote the two-page handoff and agreed owners.", filled: true },
    { label: "What changed because of your work?", value: "Review round dropped from 4 days to 2.", filled: true },
  ];
  return (
    <PhoneFrame className="bg-gradient-to-b from-lime-pale to-paper">
      <div className="flex min-h-[520px] flex-col">
        <div className="px-5 pt-2">
          <p className="text-[17px] font-bold tracking-tight text-ink">Log an onWard</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted">
            Every piece of work is a step forward — capture the win.
          </p>
          <p className="mt-2 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-lime-deep">
            2 of 3 free onWards used this month
          </p>
        </div>

        <div className="mt-3 space-y-2.5 px-5">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-[9px] font-semibold text-ink/70">{f.label}</p>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-line bg-paper px-2.5 py-2">
                <span className="min-w-0 flex-1 truncate text-[9.5px] font-medium text-ink">
                  {f.value}
                </span>
                <Mic className="h-3 w-3 shrink-0 text-ink/35" strokeWidth={2.2} />
              </div>
            </div>
          ))}

          <div>
            <p className="text-[9px] font-semibold text-ink/70">Skills you used</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {["Process design", "Collaboration", "+ Add skill"].map((s, i) => (
                <span
                  key={s}
                  className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                    i === 2
                      ? "border border-dashed border-line text-muted"
                      : "bg-lime-soft text-ink"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-dashed border-line px-2.5 py-2">
            <FileText className="h-3 w-3 text-ink/40" strokeWidth={2.2} />
            <span className="text-[9px] font-medium text-muted">Evidence</span>
            <span className="ml-auto flex items-center gap-1 text-[8.5px] font-bold text-ink/45">
              <Link2 className="h-2.5 w-2.5" strokeWidth={2.2} /> northwind.log/handoff
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-2.5 py-2">
            <span className="text-[9.5px] font-medium text-ink">Include in my portfolio</span>
            <span className="flex h-4 w-7 items-center rounded-full bg-lime px-0.5">
              <span className="ml-auto h-3 w-3 rounded-full bg-paper shadow-card" />
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 rounded-full bg-lime py-2.5 text-[11px] font-bold text-ink">
            <Check className="h-3.5 w-3.5" strokeWidth={2.8} /> Save this onWard
          </div>
          <p className="pb-2 text-center text-[8.5px] font-medium text-muted">
            Saved to your journal. Nothing is published yet.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ————— The portfolio page the app compiles ————— */

export function PortfolioScreen() {
  return (
    <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[24px] border border-line bg-paper shadow-lift">
      <div className="flex items-start justify-between bg-night px-5 py-4 text-paper">
        <div>
          <p className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-lime">
            onWard — work portfolio
          </p>
          <p className="mt-2 text-[15px] font-bold tracking-tight">Maya Chen</p>
          <p className="text-[10px] font-medium text-paper/55">
            Operations coordinator · London, UK
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-[11px] font-bold text-ink">
          MC
        </span>
      </div>

      <div className="px-5 py-4">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
          <Sprout className="h-3 w-3 text-lime-deep" strokeWidth={2.4} /> Proof at a glance
        </p>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {[
            ["9", "onWards logged"],
            ["6", "skills tracked"],
            ["16", "day streak"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-xl bg-mist px-2 py-2.5 text-center">
              <p className="text-[14px] font-bold leading-none text-ink">{n}</p>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-muted">
                {l}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
          Small steps. Tangible impact.
        </p>
        <div className="mt-2 space-y-2">
          {[
            ["28 Oct · Atlas onboarding", "Cut the onboarding handoff in half", "Review round dropped from 4 days to 2."],
            ["24 Oct · Meridian · Reporting", "Turned a spreadsheet into a standing report", "The Monday check now takes ten minutes."],
          ].map(([meta, title, impact]) => (
            <div key={title} className="rounded-xl border border-line px-3 py-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-wide text-faint">{meta}</p>
              <p className="mt-1 text-[11px] font-bold leading-snug text-ink">{title}</p>
              <p className="mt-1 text-[9px] leading-relaxed text-muted">{impact}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
          Skills. Shown by the work.
        </p>
        <div className="mt-2 space-y-2">
          {[
            ["Documentation", "Practising · 3 wins", 70],
            ["Process design", "Recorded · 1 win", 33],
          ].map(([s, stage, w]) => (
            <div key={s as string}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[10px] font-semibold text-ink">{s}</span>
                <span className="text-[8.5px] font-medium text-muted">{stage}</span>
              </div>
              <span className="mt-1 block h-1.5 rounded-full bg-mist">
                <span
                  className="block h-full rounded-full bg-lime-deep"
                  style={{ width: `${w}%` }}
                />
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 border-t border-line pt-3 text-[8px] leading-relaxed text-faint">
          Metrics are self-reported from the work logged in onWard. Built with onWard.
        </p>
      </div>
    </div>
  );
}
