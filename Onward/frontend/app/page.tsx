import Image from "next/image";
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
import { Starfield } from "@/components/starfield";
import { WorkDemo } from "@/components/work-demo";
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
    <figure className="mx-auto w-full max-w-[270px] sm:max-w-[300px]">
      <div className="overflow-hidden rounded-[34px] border-[7px] border-[#171813] bg-[#171813] p-[2px] shadow-[0_32px_80px_rgba(0,0,0,0.28)]">
        <Image
          src={src}
          alt={alt}
          width={390}
          height={1080}
          priority={priority}
          sizes="(min-width: 640px) 300px, 270px"
          className="h-auto w-full rounded-[25px]"
        />
      </div>
      <figcaption className="mt-4 text-center text-[11px] font-medium text-muted">
        {caption}
      </figcaption>
    </figure>
  );
}

const PILLARS = [
  {
    icon: CalendarDays,
    title: "Plan the day",
    body: "Keep tasks and the next small step in one calm place.",
  },
  {
    icon: Sprout,
    title: "Capture your work",
    body: "Save the wins, lessons and impact you will want to remember.",
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

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden bg-night pb-14 pt-[104px] text-paper sm:pb-20 sm:pt-[124px] lg:min-h-[760px] lg:pb-16 lg:pt-[118px]">
        <Starfield />
        <span className="pointer-events-none absolute -left-36 top-36 h-80 w-80 rounded-full bg-lime/10 blur-3xl" />
        <div className="container-x relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.78fr)] lg:items-start lg:gap-16">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:pt-20 lg:text-left">
            <p className="eyebrow">A little more intention. A lot more progress.</p>
            <h1 className="h-display mt-5 text-balance">
              Your growth,
              <br className="hidden sm:block" />{" "}
              <span className="text-lime">documented.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[clamp(15px,1.7vw,19px)] leading-relaxed text-paper/70 lg:mx-0">
              Plan your day, capture what changed, and build a story of your
              work that is ready when opportunity comes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a href={SIGNUP_URL} className="btn-light">
                Start free
                <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-[14px] font-semibold text-paper/85 transition hover:border-lime hover:text-lime"
              >
                See how it works
              </a>
            </div>
            <p className="tiny mt-4 text-paper/45">
              Free to start · Your work stays private until you choose to share it
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start">
              {["Plan", "Capture", "Reflect", "Share"].map((item, index) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-paper/10 bg-paper/5 px-3 py-1.5 text-[10px] font-semibold text-paper/65"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-lime/70" />
                  {item}
                  {index < 3 ? <span className="sr-only">then</span> : null}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[340px]">
            <span className="pointer-events-none absolute -right-10 top-16 h-40 w-40 rounded-full border border-lime/20 sm:-right-16 sm:h-56 sm:w-56" />
            <span className="pointer-events-none absolute -left-8 bottom-24 h-20 w-20 rounded-full bg-lime/10 blur-xl" />
            <div className="absolute -left-12 top-[27%] z-10 hidden rounded-2xl border border-paper/10 bg-[#181911]/95 px-3.5 py-3 shadow-lift backdrop-blur sm:block">
              <p className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.13em] text-lime">
                <Check className="h-3 w-3" strokeWidth={3} /> Saved for later
              </p>
              <p className="mt-1 text-[10px] font-semibold text-paper">A win worth remembering.</p>
            </div>
            <div className="absolute -right-5 bottom-[17%] z-10 hidden items-center gap-2 rounded-full border border-ink/5 bg-paper px-3 py-2 shadow-lift sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-pale">
                <Sprout className="h-3.5 w-3.5 text-lime-deep" />
              </span>
              <span className="text-[9px] font-semibold text-ink">Progress, in your own words</span>
            </div>
            <div className="relative">
              <ProductScreenshot
                src="/screenshots/onwards.png"
                alt="onWard mobile screen showing a timeline of work wins and their impact"
                caption="A real onWard screen · sample entries"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container-x py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">The whole journey, in one place</p>
          <h2 className="h2 mt-4">Your work is more than a to-do list.</h2>
          <p className="lead mt-4">
            onWard helps you keep the small steps, the work behind them, and
            the proof of how you are growing.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-line bg-paper p-5 sm:p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-pale text-lime-deep">
                <Icon className="h-5 w-5" strokeWidth={2.1} />
              </span>
              <h3 className="mt-4 text-[15px] font-bold tracking-tight text-ink">
                {title}
              </h3>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <WorkDemo />

      <section className="container-x py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-20">
          <div className="mx-auto max-w-xl">
            <p className="eyebrow">Reflect</p>
            <h2 className="h2 mt-4">See the skills your work is building.</h2>
            <p className="lead mt-5">
              Your record adds up over time. Look back on the wins you logged,
              the skills you practised and the days you kept showing up.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["Your rhythm", "A clear view of your consistency"],
                ["Your strengths", "Skills backed by work you logged"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-line bg-paper p-4">
                  <p className="text-[12px] font-bold text-ink">{title}</p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <ProductScreenshot
            src="/screenshots/insights.png"
            alt="onWard insights screen with monthly progress, work documented and skills showing up"
            caption="Your progress, based on the work you logged."
          />
        </div>
      </section>

      <section id="portfolio" className="bg-night py-16 text-paper sm:py-20 lg:py-24">
        <div className="container-x">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)] lg:gap-20">
            <div className="max-w-xl">
              <p className="eyebrow">Carry it forward</p>
              <h2 className="h2 mt-4">
                When opportunity comes, your story is already there.
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-paper/65">
                Turn the wins you have saved into a portfolio or CV. Choose a
                template, add your experience and education, then export or print
                when you are ready.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {["Portfolio", "CV builder", "PDF", "Word", "Print"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-paper/15 bg-paper/5 px-3 py-1.5 text-[10px] font-semibold text-paper/75"
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
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-2xl border border-paper/10 bg-paper/[0.04] p-5 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/10 text-lime">
                  <FileText className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[15px] font-bold">Start with your proof</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-paper/55">
                  Bring your selected onWards, skills and impact into a portfolio
                  that is yours to review.
                </p>
              </article>
              <article className="rounded-2xl border border-paper/10 bg-paper/[0.04] p-5 sm:mt-10 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/10 text-lime">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[15px] font-bold">Make it yours</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-paper/55">
                  Add the parts of your CV that are not in onWard yet, then
                  choose how to share it.
                </p>
              </article>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-paper/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime/10 text-lime">
                <MessageCircle className="h-4 w-4" />
              </span>
              <p className="max-w-xl text-[12px] leading-relaxed text-paper/60">
                Want to keep learning with others? Share a post in the Exchange
                and find people to follow in My Network.
              </p>
            </div>
            <a
              href={APP_URL}
              className="inline-flex shrink-0 items-center gap-2 text-[12px] font-semibold text-lime hover:underline"
            >
              Explore the app <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      <section id="students" className="container-x py-14 sm:py-16">
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-lime-pale px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="eyebrow">For students, too</p>
              <h2 className="mt-1 text-[17px] font-bold tracking-tight text-ink">
                Start building your story before graduation.
              </h2>
              <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-inksoft">
                Keep projects, coursework and new skills together as they happen.
              </p>
            </div>
          </div>
          <Link href="/pricing" className="btn-dark shrink-0">
            See student pricing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="container-x pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-[28px] bg-[#F3F4EC] px-5 py-12 text-center sm:px-8 sm:py-16">
          <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-lime/45 blur-2xl" />
          <div className="relative mx-auto max-w-2xl">
            <p className="eyebrow">Start with what you did today</p>
            <h2 className="h2 mt-4">Small steps. A story you can stand behind.</h2>
            <p className="lead mt-4">
              Begin free. Keep your work in one place, and decide what to share
              when the time is right.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
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
