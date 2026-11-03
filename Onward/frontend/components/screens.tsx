/* Hand-built renderings of the current onWard app screens.
 *
 * These replace the October screenshots and the invented mock cards: a photo of
 * an older build and a fake "3 employers viewed this week" both promise things
 * the product does not do. Everything here is drawn from the live screens in
 * Onward/app, including the exact labels, and the only fabricated part is the
 * sample entries — which the app itself seeds. */

import {
  AlarmClock,
  Bell,
  BellRing,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  Link2,
  Mic,
  Plus,
  Sprout,
  Star,
  TrendingUp,
  X,
} from "lucide-react";

const RED = "#E5484D";

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

/** The five tabs the app actually ships. */
function TabBar({ active }: { active: string }) {
  const tabs = ["Today", "Tasks", "Notes", "onWards", "You"];
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
    { title: "Review project milestones", meta: "28 Oct · 10:00 AM · Due today", steps: "2/3", done: false },
    { title: "Send the onboarding summary", meta: "28 Oct · by end of day", steps: "", done: false },
    { title: "Book the studio slot", meta: "28 Oct · 15:00 · Expired", steps: "", done: false, late: true },
    { title: "Draft the quarter note", meta: "28 Oct · 4 of 4 steps", steps: "4/4", done: true },
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

        {/* Goal gauge: the arc carries the caption, the middle the percentage. */}
        <div className="mx-4 mt-3 flex items-center gap-4 rounded-2xl border border-line bg-paper px-4 py-3">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[5px] border-line">
            <span className="absolute inset-0 rounded-full [border:5px_solid_transparent] [border-top-color:#B4E13A] [border-right-color:#B4E13A] [transform:rotate(35deg)]" />
            <span className="text-[15px] font-bold leading-none text-ink">67</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted">
              Goals reached today
            </span>
            <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-ink">
              4 of 6 done
              <TrendingUp className="h-3 w-3 text-lime-deep" strokeWidth={2.4} />
              <span className="text-[10px] font-medium text-muted">was 50%</span>
            </span>
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between px-4">
          <p className="text-[13px] font-bold text-ink">Today&apos;s journey</p>
          <span className="text-[10px] font-semibold text-lime-deep underline decoration-lime-deep/40 underline-offset-2">
            See all
          </span>
        </div>

        <div className="mt-2 space-y-2 px-4">
          {rows.map((r) => (
            <div
              key={r.title}
              className="flex items-center gap-2.5 rounded-2xl border border-line bg-paper px-3 py-2.5"
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  r.done
                    ? "border-lime-deep bg-lime"
                    : "border-dashed border-line bg-paper"
                }`}
              >
                {r.done ? <Check className="h-2.5 w-2.5 text-dark" strokeWidth={3.5} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[11px] font-semibold ${
                    r.done ? "text-faint line-through" : "text-ink"
                  }`}
                >
                  {r.title}
                </span>
                <span
                  className="mt-0.5 flex items-center gap-1 text-[9.5px] font-medium"
                  style={{ color: r.late ? RED : undefined }}
                >
                  {r.late ? <AlarmClock className="h-2.5 w-2.5" strokeWidth={2.4} /> : null}
                  <span className={r.late ? "font-semibold" : "text-muted"}>{r.meta}</span>
                </span>
              </span>
              {r.steps ? (
                <span className="rounded-full bg-lime-soft px-1.5 py-0.5 text-[9px] font-bold text-ink">
                  {r.steps}
                </span>
              ) : null}
              {r.late ? (
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                  style={{ color: RED }}
                >
                  <X className="h-2.5 w-2.5" strokeWidth={2.6} />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-3 px-4">
          <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-lime px-4 py-2.5 text-[11px] font-bold text-ink">
            <Plus className="h-3.5 w-3.5" strokeWidth={2.6} /> Log an onWard
          </div>
        </div>

        <TabBar active="Today" />
      </div>
    </PhoneFrame>
  );
}

/* ————— The create sheet ————— */

export function CreateSheetScreen() {
  const options = [
    { letter: "T", label: "New task" },
    { letter: "N", label: "New note" },
    { letter: "W", label: "New onWard" },
  ];
  return (
    <PhoneFrame className="bg-gradient-to-b from-mist to-lime-soft">
      <div className="relative flex min-h-[520px] flex-col">
        <div className="px-5 pt-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            Wednesday, 28 October
          </p>
          <p className="mt-1 text-[19px] font-bold tracking-tight text-ink">Hi, Maya.</p>
          <p className="mt-3 text-[11px] font-semibold text-ink/55">
            Room for ideas before they become something.
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 rounded-t-[26px] bg-dark px-4 pb-5 pt-4">
          <div className="grid grid-cols-3 gap-2">
            {options.map((o) => (
              <div
                key={o.label}
                className="flex flex-col items-center gap-2 rounded-[16px] bg-[#2B2C24] px-2 py-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-[12px] font-bold text-ink">
                  {o.letter}
                </span>
                <span className="text-[9.5px] font-semibold text-paper/85">{o.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-full bg-paper px-3 py-2">
            {["Today", "Tasks", "Notes"].map((s, i) => (
              <span
                key={s}
                className={`text-[9.5px] font-bold ${i === 0 ? "text-ink" : "text-ink/35"}`}
              >
                {s}
              </span>
            ))}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime">
              <X className="h-3 w-3 text-ink" strokeWidth={2.6} />
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ————— Reminders: the missed row and the modal that catches up ————— */

export function ReminderScreen() {
  return (
    <PhoneFrame className="bg-gradient-to-b from-mist to-paper">
      <div className="relative flex min-h-[520px] flex-col">
        <div className="px-5 pt-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            Wednesday, 28 October
          </p>
          <p className="mt-1 text-[19px] font-bold tracking-tight text-ink">Your tasks</p>
        </div>
        <div className="mt-3 space-y-2 px-4">
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-paper px-3 py-2.5">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-dashed border-line" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold text-ink">
                Book the studio slot
              </span>
              <span
                className="mt-0.5 flex items-center gap-1 text-[9.5px] font-semibold"
                style={{ color: RED }}
              >
                <AlarmClock className="h-2.5 w-2.5" strokeWidth={2.4} />
                28 Oct · 3:00 PM · Expired
              </span>
            </span>
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{ color: RED }}
            >
              <X className="h-2.5 w-2.5" strokeWidth={2.6} />
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-paper px-3 py-2.5">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-dashed border-line" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold text-ink">
                Prep the review deck
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-[9.5px] font-medium text-muted">
                <BellRing className="h-2.5 w-2.5 text-lime-deep" strokeWidth={2.4} />
                Tomorrow · 9:45 AM
              </span>
            </span>
            <span className="rounded-full bg-lime-soft px-1.5 py-0.5 text-[9px] font-bold text-lime-deep">
              9:45 AM
            </span>
          </div>
        </div>

        {/* The modal, which is what the reminder becomes on screen. */}
        <div className="absolute inset-0 flex flex-col justify-center bg-ink/45 px-5 backdrop-blur-[1px]">
          <div className="rounded-[22px] bg-paper p-4 shadow-lift">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: RED }}>
              <AlarmClock className="h-3 w-3" strokeWidth={2.4} />
              Missed reminder
            </p>
            <p className="mt-2.5 text-[14px] font-bold leading-snug text-ink">
              Book the studio slot
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[10.5px] font-medium text-muted">
              <Clock className="h-3 w-3" strokeWidth={2.2} />
              Was due Wed, 28 Oct · 3:00 PM
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-mist px-2.5 py-1.5 text-[9.5px] font-semibold text-ink">
                <BellRing className="h-3 w-3" strokeWidth={2.2} /> Snooze 10 min
              </span>
              <span className="flex items-center gap-1 rounded-full bg-mist px-2.5 py-1.5 text-[9.5px] font-semibold" style={{ color: RED }}>
                <X className="h-3 w-3" strokeWidth={2.4} /> Silence
              </span>
            </div>
            <span className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-lime py-2.5 text-[11px] font-bold text-ink">
              <Check className="h-3.5 w-3.5" strokeWidth={2.8} /> Mark done
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ————— Notes: the day timeline and its three pill states ————— */

export function NotesScreen() {
  const cards = [
    {
      tag: "Career",
      title: "Questions for the review",
      body: "☐ Bring the onboarding numbers\n☑ Ask who owns the roadmap",
      progress: "1 of 2 done",
      pill: { label: "06 Nov · 9:45 AM", tone: "pending" as const },
    },
    {
      tag: "Work",
      title: "Atlas onboarding notes",
      body: "The handoff stalls because nobody knows who signs off. Write the two names down.",
      progress: "",
      pill: { label: "9:19 AM", tone: "time" as const },
      pinned: true,
    },
    {
      tag: "Learning",
      title: "Course notes — pricing",
      body: "☐ Re-read the unit economics section\n☐ One example from GoDropa",
      progress: "0 of 2 done",
      pill: { label: "02 Nov · 8:00 AM", tone: "missed" as const },
    },
  ];
  return (
    <PhoneFrame className="bg-gradient-to-b from-mist to-paper">
      <div className="flex min-h-[520px] flex-col">
        <div className="px-5 pt-2">
          <p className="text-[19px] font-bold tracking-tight text-ink">Your notes</p>
          <p className="mt-0.5 text-[10px] font-medium text-muted">
            Room for ideas before they become something.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5">
            <span className="text-[9.5px] text-faint">Search your thoughts</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 px-5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
            Keep close
          </span>
          <span className="h-px flex-1 bg-line" />
          <span className="text-[9px] font-medium text-faint">1 pinned</span>
        </div>

        <div className="mt-3 space-y-2.5 px-4">
          {cards.map((c) => (
            <div
              key={c.title}
              className={`rounded-[20px] border px-3.5 py-3 ${
                c.pinned ? "border-lime-deep/40 bg-lime-pale" : "border-line bg-paper"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[9.5px] font-medium text-muted">{c.tag}</span>
                {c.pinned ? (
                  <Star className="h-3 w-3 fill-lime-deep text-lime-deep" strokeWidth={2} />
                ) : null}
              </div>
              <p className="mt-1 text-[12.5px] font-bold tracking-tight text-ink">{c.title}</p>
              <p className="mt-1 whitespace-pre-line text-[9.5px] leading-relaxed text-muted">
                {c.body}
              </p>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="truncate text-[9px] font-medium text-faint">{c.progress}</span>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${
                    c.pill.tone === "pending" ? "bg-lime-soft text-lime-deep" : ""
                  }`}
                  style={
                    c.pill.tone === "missed"
                      ? { background: "rgba(229,72,77,0.1)", color: RED }
                      : c.pill.tone === "time"
                        ? { background: "#101108", color: "#FFFFFF" }
                        : undefined
                  }
                >
                  {c.pill.tone === "time" ? (
                    <Clock className="h-2.5 w-2.5" strokeWidth={2.4} />
                  ) : (
                    <Bell className="h-2.5 w-2.5" strokeWidth={2.4} />
                  )}
                  {c.pill.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <TabBar active="Notes" />
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
            <p className="text-[10.5px] font-bold text-ink">Steps this month</p>
            <p className="text-[8.5px] font-medium text-faint">Tasks, notes and onWards</p>
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
            19 of 24 tasks complete in this window · 62% this month
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
            Every task completed is a step forward — capture the win.
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
          Metrics are self-reported from the work logged in onWard. Evidence shared with
          permission. Built with onWard.
        </p>
      </div>
    </div>
  );
}
