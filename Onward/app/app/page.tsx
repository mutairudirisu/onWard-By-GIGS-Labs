import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleCheck,
  Compass,
  Flame,
  MessageCircle,
  Sprout,
  Target,
  UsersRound,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";

const steps = [
  { time: "09:15", title: "Map out the day", detail: "Three priorities. One clear direction.", done: true },
  { time: "11:40", title: "Ship the first draft", detail: "A small step, now out in the world.", done: true },
  { time: "15:00", title: "Make time to reset", detail: "Your next step can wait until you’re ready.", done: false },
];

const pillars = [
  {
    number: "01",
    icon: Target,
    title: "Make room for what matters.",
    body: "Turn a busy day into a few clear priorities. Your plan stays close, so the next step is easier to find.",
    tone: "lime",
  },
  {
    number: "02",
    icon: Sprout,
    title: "Notice how far you’ve come.",
    body: "Save the work, milestones, and little wins you might otherwise forget. Progress deserves a place to live.",
    tone: "paper",
  },
  {
    number: "03",
    icon: UsersRound,
    title: "Grow alongside your people.",
    body: "Find your community, share what you’re learning, and show up for the people moving forward with you.",
    tone: "dark",
  },
] as const;

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[610px] pb-10 md:pb-16">
      <div className="absolute -left-7 top-16 h-40 w-40 rounded-full bg-lime/60 blur-3xl md:-left-12 md:top-24 md:h-64 md:w-64" />
      <div className="absolute -right-4 bottom-12 h-40 w-40 rounded-full bg-[#d8e6cb] blur-3xl md:-right-8 md:bottom-20 md:h-56 md:w-56" />

      <div className="relative overflow-hidden rounded-[26px] border border-ink/10 bg-white shadow-[0_35px_90px_-42px_rgba(27,30,18,0.38)] md:rounded-[32px]">
        <div className="flex items-center justify-between border-b border-ink/[0.07] px-4 py-3.5 md:px-6 md:py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-lime">
              <Sprout className="h-4 w-4 text-ink" strokeWidth={2.2} />
            </span>
            <span className="text-[12px] font-bold tracking-tight text-ink">Your day, in motion</span>
          </div>
          <span className="rounded-full bg-[#f4f5ef] px-3 py-1.5 text-[9px] font-semibold text-inksoft md:text-[10px]">
            TODAY&apos;S FOCUS
          </span>
        </div>

        <div className="grid md:grid-cols-[1fr_0.78fr]">
          <div className="p-4 md:p-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">A little focus goes a long way</p>
                <h2 className="mt-1.5 text-[22px] font-semibold tracking-[-0.06em] text-ink md:text-[28px]">You’ve got this.</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-lime bg-[#f8faef] text-[10px] font-bold text-ink">
                2/3
              </div>
            </div>

            <div className="space-y-2.5">
              {steps.map((step) => (
                <div
                  key={step.title}
                  className={`flex gap-3 rounded-2xl border px-3.5 py-3 ${
                    step.done ? "border-[#ebeee5] bg-[#fbfcf8]" : "border-dashed border-[#d9ddcf] bg-white"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                      step.done ? "bg-lime text-ink" : "border border-[#cbd0bf] text-transparent"
                    }`}
                  >
                    {step.done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[11px] font-semibold ${step.done ? "text-ink" : "text-inksoft"}`}>
                        {step.title}
                      </p>
                      <span className="text-[9px] font-medium text-faint">{step.time}</span>
                    </div>
                    <p className="mt-1 text-[9px] leading-relaxed text-muted">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f2f5e9] px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-[10px] font-semibold text-inksoft">
                <Flame className="h-3.5 w-3.5 text-[#849e28]" /> Showing up counts
              </span>
              <span className="text-[9px] font-bold text-ink">DAY 04</span>
            </div>
          </div>

          <div className="relative flex min-h-[190px] flex-col justify-between overflow-hidden bg-[#202119] p-4 text-white md:min-h-0 md:p-6">
            <span className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-lime/20" />
            <span className="absolute -right-3 -top-7 h-32 w-32 rounded-full border border-lime/20" />
            <div className="relative">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-lime">
                <Sprout className="h-3 w-3" /> A win worth keeping
              </p>
              <p className="mt-5 max-w-[190px] text-[20px] font-medium leading-[1.13] tracking-[-0.05em] md:text-[23px]">
                First version is out there.
              </p>
              <p className="mt-2 max-w-[200px] text-[10px] leading-relaxed text-white/55">
                You turned a few focused hours into something real.
              </p>
            </div>
            <div className="relative mt-8 flex items-center justify-between">
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-medium text-white/70">
                Logged today
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-1 left-0 flex items-center gap-2 rounded-full border border-ink/[0.07] bg-white px-3 py-2 shadow-[0_14px_38px_-22px_rgba(20,25,11,0.35)] md:bottom-2 md:left-[-22px] md:px-4 md:py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-pale">
          <CircleCheck className="h-4 w-4 text-[#718d20]" />
        </span>
        <span>
          <span className="block text-[9px] font-bold text-ink md:text-[10px]">A win, remembered.</span>
          <span className="block text-[8px] text-muted md:text-[9px]">Small steps add up.</span>
        </span>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <main className="overflow-hidden bg-[#f8f9f4] text-ink">
      <header className="relative z-10 mx-auto flex max-w-[1320px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12 lg:py-5">
        <Link href="/" aria-label="onWard home">
          <Wordmark className="text-[23px] sm:text-[25px]" />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          <Link className="text-[12px] font-medium text-inksoft transition hover:text-ink" href="#how-it-works">How it works</Link>
          <Link className="text-[12px] font-medium text-inksoft transition hover:text-ink" href="#your-progress">Your progress</Link>
          <Link className="text-[12px] font-medium text-inksoft transition hover:text-ink" href="#community">Community</Link>
        </nav>
        <div className="flex items-center gap-2.5 sm:gap-4">
          <Link href="/sign-in" className="rounded-full px-2 py-2 text-[11px] font-semibold text-inksoft transition hover:text-ink sm:text-[12px]">
            Sign in
          </Link>
          <Link
            href="/create-account"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[10px] font-semibold text-white transition hover:bg-[#36382d] sm:px-5 sm:text-[11px]"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-5 pb-20 pt-9 sm:px-8 sm:pb-24 sm:pt-12 md:gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-12 lg:pb-32 lg:pt-20">
        <div className="pointer-events-none absolute -left-36 top-14 h-[390px] w-[390px] rounded-full bg-[#eaf3dc]/70 blur-[100px]" />
        <div className="relative z-[1] max-w-[600px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dfe5d3] bg-white/70 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a5ce3a]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-inksoft">A fresh way to move forward</span>
          </div>
          <h1 className="max-w-[660px] text-[clamp(3.1rem,7.2vw,6.6rem)] font-semibold leading-[0.92] tracking-[-0.085em] text-ink">
            Your next
            <br />
            chapter starts
            <br />
            <span className="relative inline-block text-[#91b52d]">
              one step
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 310 14" fill="none" aria-hidden="true">
                <path d="M3 9C67 3 181 2 307 8" stroke="#C9F24E" strokeWidth="7" strokeLinecap="round" />
              </svg>
            </span>{" "}
            at a time.
          </h1>
          <p className="mt-7 max-w-[470px] text-[14px] leading-[1.7] text-inksoft sm:text-[16px]">
            Make a plan you can follow, keep the wins you’ve earned, and build a story of your progress—day by day.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/create-account"
              className="group inline-flex items-center gap-3 rounded-full bg-[#c9f24e] px-5 py-3.5 text-[12px] font-bold text-ink shadow-[0_8px_24px_-12px_rgba(139,174,48,0.7)] transition hover:-translate-y-0.5 hover:bg-[#d4f777] sm:px-6"
            >
              Start your onWard journey
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white transition group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <Link href="#how-it-works" className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[11px] font-semibold text-inksoft transition hover:bg-white hover:text-ink">
              Take a look <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-7 flex items-center gap-2 text-[10px] font-medium text-muted">
            <span className="flex -space-x-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#f8f9f4] bg-[#e3eccb] text-[7px] font-bold text-ink">Y</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#f8f9f4] bg-[#dfe8f1] text-[7px] font-bold text-ink">G</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#f8f9f4] bg-[#f1e2d4] text-[7px] font-bold text-ink">U</span>
            </span>
            Your progress. Your pace. Your story.
          </div>
        </div>

        <div className="relative z-[1] lg:pl-3">
          <ProductPreview />
        </div>
      </section>

      <section aria-label="What onWard helps you do" className="border-y border-ink/[0.07] bg-white/65">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-5 px-5 py-7 sm:grid-cols-3 sm:gap-0 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 sm:justify-center sm:border-r sm:border-ink/[0.08]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f4e5]"><Target className="h-4 w-4 text-[#7b9828]" /></span>
            <span><span className="block text-[11px] font-bold text-ink">Find your focus</span><span className="mt-0.5 block text-[9px] text-muted">Make space for the next step</span></span>
          </div>
          <div className="flex items-center gap-3 sm:justify-center sm:border-r sm:border-ink/[0.08]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f4e5]"><Sprout className="h-4 w-4 text-[#7b9828]" /></span>
            <span><span className="block text-[11px] font-bold text-ink">Keep your wins</span><span className="mt-0.5 block text-[9px] text-muted">See your growth take shape</span></span>
          </div>
          <div className="flex items-center gap-3 sm:justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f4e5]"><Compass className="h-4 w-4 text-[#7b9828]" /></span>
            <span><span className="block text-[11px] font-bold text-ink">Find your people</span><span className="mt-0.5 block text-[9px] text-muted">Build momentum together</span></span>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end lg:gap-20">
          <div>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#799529]">A rhythm that feels like yours</p>
            <h2 className="max-w-[570px] text-[clamp(2.6rem,5vw,4.7rem)] font-semibold leading-[0.97] tracking-[-0.075em]">
              Progress isn’t a finish line.
              <span className="text-[#96b63f]"> It’s a practice.</span>
            </h2>
          </div>
          <p className="max-w-[430px] text-[14px] leading-[1.75] text-inksoft lg:justify-self-end">
            Big goals are built in ordinary moments. onWard gives those moments a little structure—and makes sure your effort doesn’t disappear when the day is done.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:mt-16 md:grid-cols-3">
          {pillars.map(({ number, icon: Icon, title, body, tone }) => (
            <article
              key={number}
              className={`group relative flex min-h-[270px] flex-col overflow-hidden rounded-[26px] p-6 transition duration-300 hover:-translate-y-1 sm:p-7 ${
                tone === "lime"
                  ? "bg-[#dff2ae]"
                  : tone === "dark"
                    ? "bg-[#24251d] text-white"
                    : "border border-ink/[0.08] bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  tone === "dark" ? "bg-white/10 text-lime" : "bg-white/65 text-ink"
                }`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span className={`text-[10px] font-semibold ${tone === "dark" ? "text-white/40" : "text-ink/40"}`}>{number}</span>
              </div>
              <div className="mt-auto pt-12">
                <h3 className={`max-w-[260px] text-[22px] font-semibold leading-[1.05] tracking-[-0.06em] ${
                  tone === "dark" ? "text-white" : "text-ink"
                }`}>{title}</h3>
                <p className={`mt-3 max-w-[310px] text-[11px] leading-[1.65] ${
                  tone === "dark" ? "text-white/60" : "text-inksoft"
                }`}>{body}</p>
              </div>
              {tone === "dark" ? (
                <span className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-lime/20 transition duration-500 group-hover:scale-110" />
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section id="your-progress" className="relative overflow-hidden bg-[#22231c] text-white">
        <div className="absolute -right-24 top-[-200px] h-[460px] w-[460px] rounded-full border border-lime/10" />
        <div className="absolute -right-2 top-[-122px] h-[300px] w-[300px] rounded-full border border-lime/10" />
        <div className="relative mx-auto grid max-w-[1320px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:px-12 lg:py-36">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/70">
              <Sprout className="h-3 w-3 text-lime" /> Look back. Keep growing.
            </span>
            <h2 className="mt-6 max-w-[540px] text-[clamp(2.8rem,5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.075em]">
              One day, you’ll be glad you kept going.
            </h2>
            <p className="mt-5 max-w-[410px] text-[13px] leading-[1.75] text-white/60 sm:text-[14px]">
              Your onWards turn everyday effort into a record of what you’ve learned, made, and overcome—ready when you need to see how far you’ve come.
            </p>
            <Link href="/create-account" className="mt-7 inline-flex items-center gap-2 text-[11px] font-semibold text-lime transition hover:gap-3">
              Start keeping your story <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -left-2 top-10 h-40 w-40 rounded-full bg-lime/15 blur-3xl" />
            <div className="relative rounded-[26px] border border-white/10 bg-white/[0.06] p-4 shadow-[0_40px_90px_-42px_rgba(0,0,0,0.7)] backdrop-blur md:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">Your progress, lately</p>
                  <p className="mt-1 text-[16px] font-semibold tracking-[-0.04em]">Look at you go.</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime text-ink"><ArrowUpRight className="h-4 w-4" /></span>
              </div>
              <div className="space-y-1 pt-3">
                {[
                  ["This week", "Found a rhythm that works", "A new routine"],
                  ["Last week", "Shared an idea with your community", "A brave first"],
                  ["Earlier", "Finished what you started", "A promise kept"],
                ].map(([date, title, tag], index) => (
                  <div key={title} className="flex gap-3 py-3">
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 flex h-2.5 w-2.5 items-center justify-center rounded-full ${
                        index === 0 ? "bg-lime ring-4 ring-lime/10" : "bg-white/30"
                      }`} />
                      {index < 2 ? <span className="mt-1 h-full min-h-8 w-px bg-white/10" /> : null}
                    </div>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-white/40">{date}</p>
                        <p className="mt-1 text-[11px] font-semibold text-white/90">{title}</p>
                      </div>
                      <span className="mt-1 shrink-0 rounded-full bg-white/[0.08] px-2.5 py-1 text-[8px] font-medium text-white/55">{tag}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between rounded-2xl bg-lime px-4 py-3 text-ink">
                <span className="text-[10px] font-semibold">Every step belongs in your story.</span>
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="community" className="mx-auto grid max-w-[1320px] gap-10 px-5 py-20 sm:px-8 sm:py-28 md:grid-cols-[1fr_0.85fr] md:items-center lg:gap-24 lg:px-12 lg:py-36">
        <div>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#799529]">Better, together</p>
          <h2 className="max-w-[610px] text-[clamp(2.8rem,5.5vw,5.2rem)] font-semibold leading-[0.94] tracking-[-0.08em]">
            Your people make the journey richer.
          </h2>
          <p className="mt-5 max-w-[460px] text-[13px] leading-[1.75] text-inksoft sm:text-[14px]">
            Find people who get what you’re working toward. Trade ideas, celebrate the little wins, and keep each other moving.
          </p>
          <Link href="/communities" className="mt-7 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-3 text-[11px] font-semibold transition hover:border-ink/30 hover:bg-[#f4f7ec]">
            Explore the community <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-[470px]">
          <div className="absolute inset-5 rounded-[32px] bg-[#deedc3] blur-2xl" />
          <div className="relative rounded-[28px] border border-ink/[0.08] bg-white p-5 shadow-[0_24px_70px_-44px_rgba(32,38,21,0.45)] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">A little encouragement</p>
                <p className="mt-1 text-[15px] font-semibold tracking-[-0.04em]">Good things are happening.</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f5e5]"><UsersRound className="h-4 w-4 text-[#718d20]" /></span>
            </div>
            <div className="mt-5 space-y-2.5">
              <div className="rounded-2xl bg-[#f8f9f5] p-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e1ebce]"><Sprout className="h-3.5 w-3.5 text-[#718d20]" /></span>
                  <span className="text-[9px] font-semibold text-ink">A member shared a win</span>
                  <span className="ml-auto text-[8px] text-muted">just now</span>
                </div>
                <p className="ml-9 mt-2 text-[10px] leading-relaxed text-inksoft">Finally made time to work on the thing I’ve been putting off. One page done, and a little momentum.</p>
                <div className="ml-9 mt-2.5 flex items-center gap-1.5 text-[8px] font-semibold text-[#6e882a]"><MessageCircle className="h-3 w-3" /> Send a little encouragement</div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#eef0e9] px-3.5 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4eddd]"><Sprout className="h-4 w-4 text-[#987c42]" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[9px] font-semibold text-ink">Someone is celebrating a milestone</span>
                  <span className="mt-0.5 block text-[8px] text-muted">A reason to cheer each other on</span>
                </span>
                <Sprout className="h-4 w-4 text-[#8ba839]" aria-hidden="true" />
              </div>
            </div>
          </div>
          <span className="absolute -bottom-4 -left-3 flex items-center gap-2 rounded-full bg-[#22231c] px-3 py-2 text-[9px] font-semibold text-white shadow-lg sm:-left-7">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-ink"><Check className="h-3 w-3" strokeWidth={3} /></span>
            Progress feels better shared
          </span>
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-8 lg:px-12">
        <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[30px] bg-[#c9f24e] px-6 py-12 sm:px-12 sm:py-16 lg:px-20 lg:py-20">
          <span className="absolute -right-16 -top-28 h-[340px] w-[340px] rounded-full border border-ink/10" />
          <span className="absolute -right-2 -top-16 h-[220px] w-[220px] rounded-full border border-ink/10" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.16em] text-ink/60">Start wherever you are</p>
              <h2 className="max-w-[650px] text-[clamp(2.7rem,5vw,5.2rem)] font-semibold leading-[0.93] tracking-[-0.08em]">
                Your next step is closer than you think.
              </h2>
            </div>
            <Link href="/create-account" className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-ink px-5 py-3.5 text-[11px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#3c3e32] sm:px-6">
              Make it an onWard day
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime text-ink transition group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <Link href="/" aria-label="onWard home"><Wordmark className="text-[20px]" /></Link>
        <p className="text-[9px] text-muted">A little more intention. A lot more progress.</p>
        <div className="flex items-center gap-5 text-[10px] font-medium text-inksoft">
          <Link className="transition hover:text-ink" href="/sign-in">Sign in</Link>
          <Link className="inline-flex items-center gap-1 transition hover:text-ink" href="/create-account">Get started <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
      </footer>
    </main>
  );
}
