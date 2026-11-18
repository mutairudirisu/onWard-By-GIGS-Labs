"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  GraduationCap,
  Hammer,
  Sprout,
  Store,
  Users,
} from "lucide-react";
import { PhoneShell } from "@/components/phone-shell";
import { PortfolioDownloadButton, usePortfolio } from "@/components/portfolio-download";
import { BackLink, ProgressBar, Tag } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { useCurrentUser } from "@/components/auth";
import { useStore } from "@/components/store";
import { useActivity } from "@/lib/activity";
import { PRO_PRICING } from "@/lib/data";
import { haptic } from "@/lib/haptics";
import {
  STUDENT_LOGS,
  groupByProject,
  isStudentRole,
  placementReadiness,
  pricingFor,
  wardsSince,
} from "@/lib/student";

const LOG_ICONS = {
  Coursework: BookOpen,
  "Side project": Hammer,
  Internship: Briefcase,
  "Club or society": Users,
  "Part-time job": Store,
} as const;

export default function StudentSpacePage() {
  const user = useCurrentUser();
  const { onWards, skills, settings } = useStore();
  const { streak } = useActivity();
  const portfolio = usePortfolio();

  const student = isStudentRole(user.role);
  const pricing = pricingFor(user.role);
  const term = wardsSince(onWards, 30);
  const projects = groupByProject(term);
  const evidence = term.reduce((n, w) => n + (w.evidence?.length ?? w.files ?? 0), 0);
  const readiness = placementReadiness({ user, onWards, skills, streak });
  const readyCount = readiness.filter((r) => r.done).length;
  const buzz = () => haptic("tap", settings.haptics);

  return (
    <PhoneShell indicator wide>
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <BackLink href="/profile" label="Back to profile" />
          <span className="flex items-center gap-1.5">
            <Sprout className="h-3.5 w-3.5 text-lime-deep" strokeWidth={2.2} />
            <Wordmark className="text-[12px]" />
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
          <GraduationCap className="h-3.5 w-3.5" />
          Student space
        </span>
      </div>

      <section
        className={`mb-6 rounded-2xl px-4 py-4 ${student ? "bg-lime text-dark" : "card"}`}
      >
        <h1 className={`text-[19px] font-bold leading-tight tracking-tight ${student ? "text-dark" : "text-ink"}`}>
          {student ? "Student rate is on" : `Welcome, ${user.name.split(" ")[0] || "there"}`}
        </h1>
        <p className={`mt-1.5 text-[11.5px] leading-[1.55] ${student ? "text-dark/75" : "text-muted"}`}>
          {student
            ? `Pro costs ${pricing.currency}${pricing.monthly.toLocaleString("en-NG")}/mo while you study - half the regular ${PRO_PRICING.currency}${PRO_PRICING.monthly.toLocaleString("en-NG")}. Everything else works the same.`
            : "Tell us you are studying and Pro drops to half price. Your portfolio, streak and evidence stay exactly where they are."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {student ? (
            <Link
              href="/upgrade"
              onClick={buzz}
              className="flex items-center gap-1.5 rounded-full bg-panel px-3.5 py-2 text-[12px] font-bold text-on-panel"
            >
              See student pricing
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/profile/role"
              onClick={buzz}
              className="flex items-center gap-1.5 rounded-full bg-lime px-3.5 py-2 text-[12px] font-bold text-dark"
            >
              Set my role to Student
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <Link
            href="/portfolio"
            onClick={buzz}
            className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[12px] font-bold text-inksoft"
          >
            My portfolio
          </Link>
        </div>
      </section>

      <h2 className="mb-1 text-[13px] font-bold tracking-tight text-ink">
        Log something you did this week
      </h2>
      <p className="mb-3 text-[10px] leading-[1.5] text-muted">
        Each card opens a new onWard with that label already in the title, and files it under the
        same project below.
      </p>
      <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        {STUDENT_LOGS.map((item) => {
          const Icon = LOG_ICONS[item.project as keyof typeof LOG_ICONS];
          return (
            <Link
              key={item.project}
              href={`/onwards/new?title=${encodeURIComponent(item.title)}&project=${encodeURIComponent(item.project)}`}
              onClick={buzz}
              className="card flex flex-col gap-2 px-3.5 py-3 transition hover:border-lime-deep/60 active:scale-[0.99]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime-soft text-ink">
                <Icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span>
                <span className="block text-[11.5px] font-bold leading-tight text-ink">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[9px] leading-[1.4] text-muted">
                  {item.hint}
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <h2 className="mb-2.5 text-[13px] font-bold tracking-tight text-ink">Last 30 days</h2>
      <section className="card mb-6 px-4 py-3.5">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { value: term.length, label: "logged" },
            { value: evidence, label: "evidence" },
            { value: skills.length, label: "skills" },
            { value: streak.current, label: "day streak" },
          ].map((cell) => (
            <div key={cell.label} className="rounded-xl bg-lime-pale px-1 py-2.5">
              <p className="text-[16px] font-bold leading-none tracking-tight text-ink">
                {cell.value}
              </p>
              <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-inksoft">
                {cell.label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3.5 border-t border-line pt-3">
          {projects.length ? (
            <div className="flex flex-wrap gap-1.5">
              {projects.map((p) => (
                <Tag key={p.project}>
                  {p.project} · {p.count}
                </Tag>
              ))}
            </div>
          ) : (
            <p className="text-[10px] leading-[1.5] text-muted">
              Nothing logged in the last 30 days. One entry a week keeps a placement portfolio
              honest.
            </p>
          )}
        </div>
      </section>

      <h2 className="mb-2.5 text-[13px] font-bold tracking-tight text-ink">Placement readiness</h2>
      <section className="card mb-6 px-4 py-3.5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[11px] font-bold text-ink">
            {readyCount} of {readiness.length} done
          </p>
          <p className="text-[9px] text-muted">
            {readyCount === readiness.length
              ? "Ready to share"
              : "One tap each to close the gap"}
          </p>
        </div>
        <ProgressBar value={(readyCount / readiness.length) * 100} className="mb-3" />
        <ul className="space-y-2.5">
          {readiness.map((item) => (
            <li key={item.key} className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  item.done ? "bg-lime-deep text-dark" : "border border-dash"
                }`}
              >
                {item.done ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : null}
              </span>
              <span className="flex-1">
                <span
                  className={`block text-[11px] font-semibold ${item.done ? "text-muted" : "text-ink"}`}
                >
                  {item.label}
                </span>
                <span className="block text-[9px] leading-[1.45] text-muted">{item.detail}</span>
              </span>
              {!item.done ? (
                <Link
                  href={item.href}
                  onClick={buzz}
                  className="shrink-0 rounded-full bg-cream px-2.5 py-1 text-[9px] font-bold text-ink"
                >
                  {item.cta}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <h2 className="mb-2.5 text-[13px] font-bold tracking-tight text-ink">
        Take it to an interviewer
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        <PortfolioDownloadButton portfolio={portfolio} label="Download PDF" className="w-full" />
        <Link
          href="/portfolio"
          onClick={buzz}
          className="flex w-full items-center justify-center gap-2 rounded-btn border border-line bg-paper px-4 py-3 text-[12.5px] font-bold text-ink"
        >
          Preview portfolio
        </Link>
      </div>

      <p className="mt-5 text-center text-[9px] leading-[1.6] text-faint">
        The student rate follows the role on your profile. We do not ask for a student ID - we
        trust you are studying.
      </p>
    </PhoneShell>
  );
}
