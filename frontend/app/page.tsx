import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  FileText,
  MessageCircle,
  Sprout,
  UsersRound,
} from "lucide-react";
import { WorkDemo } from "@/components/work-demo";
import { StepsShowcase } from "@/components/steps-showcase";
import { ProductPhone } from "@/components/product-phone";
import { FaqAccordion } from "@/components/faq-accordion";
import { APP_URL, SIGNUP_URL } from "@/lib/site";

function ProductScreenshot({
  src,
  alt,
  caption,
  priority = false,
}: {
  src: string;
  alt: string;
  caption: string;
  priority?: boolean;
}) {
  return (
    <figure className="relative z-10 mx-auto w-full max-w-[250px] sm:max-w-[270px]">
      <ProductPhone
        src={src}
        alt={alt}
        priority={priority}
        sizes="(min-width: 640px) 270px, 84vw"
      />
      <figcaption className="mt-4 text-center text-[12px] font-medium text-muted">
        {caption}
      </figcaption>
    </figure>
  );
}

function JourneyOrbit() {
  return (
    <svg
      viewBox="0 0 520 520"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full text-ink/35 motion-safe:animate-[onward-orbit_55s_linear_infinite]"
    >
      <defs>
        <path
          id="onward-hero-orbit"
          d="M 260,260 m -226,0 a 226,226 0 1,1 452,0 a 226,226 0 1,1 -452,0"
        />
      </defs>
      <circle cx="260" cy="260" r="226" fill="none" stroke="currentColor" strokeOpacity=".12" />
      <text
        fill="currentColor"
        fontFamily="Arial, sans-serif"
        fontSize="11"
        fontWeight="600"
        letterSpacing="3.2"
      >
        <textPath href="#onward-hero-orbit">
          PLAN AHEAD · NOTICE YOUR PROGRESS · KEEP THE PROOF · SHARE WHEN READY ·
        </textPath>
      </text>
    </svg>
  );
}

const PILLARS = [
  {
    icon: CalendarDays,
    title: "Plan the day",
    body: "Keep your tasks and the next small step in one calm place.",
  },
  {
    icon: Sprout,
    title: "Capture your work",
    body: "Save the wins, lessons, and impact you will want to remember.",
  },
  {
    icon: BookOpen,
    title: "See your progress",
    body: "Notice the skills and habits your work is building over time.",
  },
  {
    icon: UsersRound,
    title: "Grow together",
    body: "Share ideas in the Exchange and find people in My Network.",
  },
];

const FAQS = [
  {
    question: "Is onWard just a to-do list?",
    answer:
      "No. Plan your next steps, then keep a record of what you did, what changed, and the skills and evidence connected to the work.",
  },
  {
    question: "Who can see the work I save?",
    answer:
      "Your onWards are private by default. You choose what to include in a portfolio or share with other people.",
  },
  {
    question: "Can I use onWard to build a portfolio or CV?",
    answer:
      "Yes. Select the onWards that show your work, add your experience and education, choose a template, and export or print when you are ready.",
  },
  {
    question: "Is onWard useful for students?",
    answer:
      "Yes. Keep coursework, projects, and new skills together as they happen, so you have a clearer record to draw on later.",
  },
  {
    question: "Can I connect with people and share ideas?",
    answer:
      "My Network helps you find and keep up with people. The Exchange is a place to share posts and learn from the wider onWard community.",
  },
];

export default function Home() {
  return (
    <main className="overflow-x-clip bg-paper">
      <div className="flex min-h-10 items-center justify-center gap-2 bg-[#173e31] px-4 py-2 text-center text-[11px] font-medium text-paper sm:text-[13px]">
        <span>Small steps add up. Give your progress a place to live.</span>
        <a
          href={SIGNUP_URL}
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-lime transition hover:gap-2"
        >
          Start free <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <section className="relative overflow-hidden bg-[#fbfaf3] pb-16 pt-20 sm:pb-20 sm:pt-28 lg:pb-24">
        <span className="pointer-events-none absolute -left-40 top-28 h-[28rem] w-[28rem] rounded-full bg-lime/10 blur-3xl" />
        <span className="pointer-events-none absolute -right-36 top-64 h-96 w-96 rounded-full bg-[#dbe7c6]/55 blur-3xl" />
        <div className="container-x relative">
          <div className="mx-auto max-w-[1040px] text-center">
            <p className="eyebrow">A calmer way to grow</p>
            <h1 className="editorial-display mt-6 text-balance text-ink">
              Your work deserves
              <br className="hidden sm:block" />{" "}
              <span className="font-serif italic text-lime-deep">
                to be remembered.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-ink/65 sm:text-[19px]">
              Plan your day, capture what changed, and turn the work you do into
              a story you can carry forward.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href={SIGNUP_URL} className="btn-dark px-7 py-3.5 text-[15px]">
                Start your onWard
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/60 px-6 py-3.5 text-[14px] font-semibold text-ink transition hover:border-ink/35 hover:bg-paper"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-[13px] text-ink/45">
              Private by default. Share when you choose.
            </p>
          </div>

          <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
            <div className="pointer-events-none absolute left-1/2 top-[43%] h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 sm:h-[500px] sm:w-[500px]">
              <JourneyOrbit />
            </div>

            <div className="absolute left-0 top-[22%] z-10 hidden max-w-[230px] rounded-[22px] border border-line/80 bg-paper/95 p-5 text-left shadow-[0_20px_60px_rgba(16,17,8,0.10)] backdrop-blur md:block">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lime-deep">
                Start with today
              </p>
              <p className="mt-2 text-[18px] font-semibold leading-snug tracking-tight text-ink">
                A plan you can actually come back to.
              </p>
              <div className="mt-4 space-y-2.5 text-[13px] text-ink/65">
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-lime-deep" /> Keep the next step clear
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-lime-deep" /> Make room for what matters
                </p>
              </div>
            </div>

            <div className="absolute bottom-[18%] right-0 z-10 hidden max-w-[230px] rounded-[22px] border border-line/80 bg-paper/95 p-5 text-left shadow-[0_20px_60px_rgba(16,17,8,0.10)] backdrop-blur md:block">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-pale text-lime-deep">
                <Sprout className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[18px] font-semibold leading-snug tracking-tight text-ink">
                Keep more than the task.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Save the impact, skills, and evidence behind a piece of work.
              </p>
            </div>

            <ProductScreenshot
              src="/app-screens/home-light.jpg"
              alt="onWard home screen showing the weekly calendar, focus timer, checklist and logged work"
              caption="Your day, work and progress in one place"
              priority
            />
          </div>
        </div>
      </section>

      <section aria-label="The onWard journey" className="overflow-hidden bg-night py-6 text-paper sm:py-7">
        <p className="sr-only">
          Plan the day, capture your work, see your progress, and share when
          you are ready.
        </p>
        <div
          aria-hidden="true"
          className="flex w-max motion-safe:animate-[onward-marquee_36s_linear_infinite]"
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center gap-8 px-4 sm:gap-12">
              {["Plan", "Capture", "Reflect", "Carry it forward", "Connect"].map(
                (item) => (
                  <span
                    key={item}
                    className="flex items-center gap-8 whitespace-nowrap font-serif text-[24px] italic text-paper/90 sm:gap-12 sm:text-[30px]"
                  >
                    {item}
                    <span className="h-2 w-2 rounded-full bg-lime" />
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="container-x py-24 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">The whole journey, in one place</p>
          <h2 className="editorial-heading mt-5 text-ink">
            More than a list of things to do.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-muted sm:text-[18px]">
            onWard helps you keep the small steps, the work behind them, and
            the proof of how you are growing.
          </p>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, body }, index) => (
            <article
              key={title}
              className="group rounded-[24px] border border-line bg-paper p-6 transition duration-300 hover:-translate-y-1 hover:border-lime/60 hover:shadow-[0_18px_48px_rgba(16,17,8,0.07)] sm:p-7"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-pale text-lime-deep transition group-hover:bg-lime">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.15em] text-muted/80">
                0{index + 1}
              </p>
              <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-ink sm:text-[20px]">
                {title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted sm:text-[15px]">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <WorkDemo />
      <StepsShowcase />

      <section className="bg-[#f0f2e7] py-24 sm:py-28 lg:py-36">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Progress is personal. Growth is shared.</p>
            <h2 className="editorial-heading mt-5 text-ink">
              Find your people, and keep learning together.
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink/65 sm:text-[18px]">
              Build connections in My Network, catch up on the work people
              share, and bring your ideas to the Exchange.
            </p>
            <a
              href={APP_URL}
              className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-ink transition hover:gap-3"
            >
              Explore the onWard community <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[26px] bg-paper p-6 shadow-[0_18px_60px_rgba(16,17,8,0.06)] sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-pale text-lime-deep">
                <UsersRound className="h-5 w-5" />
              </span>
              <h3 className="mt-6 font-serif text-[27px] leading-tight tracking-tight text-ink">
                My Network
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-muted sm:text-[15px]">
                Discover people, build connections, and catch up with the work
                your community shares.
              </p>
            </article>
            <article className="rounded-[26px] bg-night p-6 text-paper shadow-[0_18px_60px_rgba(16,17,8,0.1)] sm:mt-10 sm:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime/10 text-lime">
                <MessageCircle className="h-5 w-5" />
              </span>
              <h3 className="mt-6 font-serif text-[27px] leading-tight tracking-tight">
                The Exchange
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-paper/65 sm:text-[15px]">
                Share what you are learning, join a conversation, and pick up
                ideas from others.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="portfolio" className="bg-night py-24 text-paper sm:py-28 lg:py-36">
        <div className="container-x">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)] lg:gap-20">
            <div className="max-w-2xl">
              <p className="eyebrow">Carry it forward</p>
              <h2 className="editorial-heading mt-5 text-paper">
                When opportunity comes, your story is already there.
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-paper/65 sm:text-[18px]">
                Turn the wins you have saved into a portfolio or CV. Choose a
                template, add your experience and education, then export or
                print when you are ready.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {["Portfolio", "CV builder", "PDF", "Word", "Print"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-paper/15 bg-paper/5 px-3.5 py-2 text-[12px] font-semibold text-paper/75"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <a href={APP_URL} className="btn-lime mt-8">
                Build your story
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-[24px] border border-paper/10 bg-paper/[0.04] p-6 sm:p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime/10 text-lime">
                  <FileText className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[18px] font-semibold sm:text-[20px]">
                  Start with your proof
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-paper/60 sm:text-[15px]">
                  Bring selected onWards, skills, and impact into a portfolio
                  that is yours to review.
                </p>
              </article>
              <article className="rounded-[24px] border border-paper/10 bg-paper/[0.04] p-6 sm:mt-10 sm:p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime/10 text-lime">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[18px] font-semibold sm:text-[20px]">
                  Make it yours
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-paper/60 sm:text-[15px]">
                  Add the parts of your CV that are not in onWard yet, then
                  choose how to share it.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="students" className="container-x py-16 sm:py-20">
        <div className="flex flex-col gap-6 rounded-[26px] border border-line bg-lime-pale px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-9 sm:py-9">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime text-ink">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow">For students, too</p>
              <h2 className="mt-2 font-serif text-[clamp(25px,3.2vw,38px)] leading-tight tracking-tight text-ink">
                Start building your story before graduation.
              </h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink/65 sm:text-[16px]">
                Keep projects, coursework, and new skills together as they happen.
              </p>
            </div>
          </div>
          <Link href="/pricing" className="btn-dark shrink-0">
            See student pricing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="container-x py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow">A few things you might be wondering</p>
            <h2 className="editorial-heading mt-5 text-ink">
              Good questions.
            </h2>
          </div>
          <FaqAccordion items={FAQS} />
        </div>
      </section>

      <section className="container-x pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[32px] bg-[#f0f2e7] px-6 py-16 text-center sm:px-10 sm:py-20">
          <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-lime/45 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-28 -left-14 h-64 w-64 rounded-full bg-[#d5e5bb]/70 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <p className="eyebrow">Start with what you did today</p>
            <h2 className="editorial-heading mt-5 text-ink">
              Small steps. A story you can stand behind.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-ink/65 sm:text-[18px]">
              Begin free. Keep your work in one place, and decide what to share
              when the time is right.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={SIGNUP_URL} className="btn-dark">
                Get started <ArrowRight className="h-4 w-4" />
              </a>
              <Link href="/pricing" className="btn-ghost">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
