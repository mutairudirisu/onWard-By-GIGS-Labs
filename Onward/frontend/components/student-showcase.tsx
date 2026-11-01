import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  GraduationCap,
  Hammer,
  Store,
  Users,
} from "lucide-react";
import { Starfield } from "@/components/starfield";
import { APP_URL } from "@/lib/site";

const STAGES = [
  {
    term: "Year 1",
    title: "First logs",
    body: "A coursework submission, the club you joined, the small app you built at night. Twenty seconds, while it is still fresh.",
  },
  {
    term: "Year 2",
    title: "Skills start stacking",
    body: "The same skill shows up on four different projects. That is proof now, not a line you write on a form at graduation.",
  },
  {
    term: "Year 3",
    title: "Evidence and placement",
    body: "Screenshots, links and files sit on the onWard itself. The readiness list tells you what an interviewer will still ask for.",
  },
  {
    term: "Graduation",
    title: "More than a certificate",
    body: "One shareable link and a PDF, built across four years — ready before anyone asks you for a CV.",
  },
];

const QUICK_LOGS = [
  { label: "Coursework", Icon: BookOpen },
  { label: "Side project", Icon: Hammer },
  { label: "Internship", Icon: Briefcase },
  { label: "Club or society", Icon: Users },
  { label: "Part-time job", Icon: Store },
];

export function StudentShowcase() {
  return (
    <section id="students" className="relative overflow-hidden bg-night text-paper">
      <Starfield />
      <span className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-lime/10 blur-3xl" />
      <div className="container-x relative py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <p className="eyebrow">For students</p>
            <h2 className="h2 mt-4">
              Plan your future
              <br />
              while you&apos;re still in school.
            </h2>
            <div className="mt-6 max-w-xl space-y-4 text-[15.5px] leading-relaxed text-paper/65 sm:text-[16.5px]">
              <p>
                onWard is not just for people who are already working. It is also a
                platform for students in colleges and universities who want to start
                building their future before graduation.
              </p>
              <p>
                Students use onWard throughout their academic journey to document their
                activities, track personal achievements, manage projects, record the
                skills they are developing, and keep track of their growth.
              </p>
              <p>
                Rather than waiting until graduation to start preparing for employment,
                you build that record gradually — experiences, accomplishments,
                projects, capabilities — as they happen.
              </p>
              <p>
                By the time you graduate, you have more than a certificate. You have a
                documented journey of your growth, practical experience, achievements
                and skills that you can confidently show a potential employer.
              </p>
            </div>
            <p className="mt-8 rounded-2xl border border-lime/25 bg-lime/10 px-5 py-4 text-[15px] font-bold leading-snug text-lime sm:text-[16px]">
              Start building your future while you&apos;re still in school. Your journey
              matters, and every achievement counts.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={`${APP_URL}/student`} className="btn-lime">
                Open the student space
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-paper/20 px-6 py-3 text-[14px] font-semibold text-paper/85 transition hover:border-lime hover:text-lime"
              >
                Pro is half price for students
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-[32px] border border-paper/10 bg-dark p-6 sm:p-8">
              <span className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-lime/15 blur-2xl" />
              <div className="relative">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-paper/50">
                  <GraduationCap className="h-4 w-4 text-lime" strokeWidth={2.2} />
                  Four years, documented
                </p>
                <ol className="mt-7">
                  {STAGES.map((s, i) => (
                    <li key={s.term} className="relative flex gap-4">
                      {i < STAGES.length - 1 ? (
                        <span className="absolute left-4 top-9 h-[calc(100%-12px)] w-px bg-paper/15" />
                      ) : null}
                      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime text-[12px] font-bold text-ink">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1 pb-7">
                        <p className="flex flex-wrap items-baseline gap-x-2.5">
                          <span className="text-[15.5px] font-bold tracking-tight">
                            {s.title}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-lime/80">
                            {s.term}
                          </span>
                        </p>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-paper/55">
                          {s.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 lg:mt-16">
          <p className="text-center text-[12px] font-bold uppercase tracking-[0.18em] text-paper/40">
            Log the week in whatever you actually did
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {QUICK_LOGS.map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-paper/12 bg-paper/5 px-4 py-2.5 text-[13px] font-semibold text-paper/80"
              >
                <Icon className="h-4 w-4 text-lime" strokeWidth={2.2} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
