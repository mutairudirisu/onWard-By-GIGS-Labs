"use client";

import { PhoneShell } from "@/components/phone-shell";
import { PortfolioDownloadButton } from "@/components/portfolio-download";
import { BackButton, Tag } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { useCurrentUser } from "@/components/auth";
import { useActivity } from "@/lib/activity";
import { appraisal, portfolioWins } from "@/lib/data";
import { CheckCircle2, Mail, Sprout } from "lucide-react";

export default function EmployerPortfolioPage() {
  const user = useCurrentUser();
  const { streak } = useActivity();
  return (
    <PhoneShell>
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <BackButton label="Back to portfolio" fallback="/profile" />
          <span className="flex items-center gap-1.5">
            <Sprout className="h-3.5 w-3.5 text-lime-deep" strokeWidth={2.2} />
            <Wordmark className="text-[12px]" />
          </span>
        </span>
        <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
          Work portfolio
        </span>
      </div>

      <section className="mb-5">
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-lime-soft text-[12px] font-bold text-ink">
          {user.initials}
        </span>
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink">
          {user.name}
        </h1>
        <p className="mt-1 text-[11px] font-semibold text-inksoft">
          {user.role || "Role not set yet"}
        </p>
        {user.location ? <p className="text-[9px] text-muted">{user.location}</p> : null}
        <p className="mt-3 text-[10.5px] leading-[1.6] text-inksoft">{user.bio}</p>
      </section>

      <section className="mb-5 rounded-2xl border border-lime-deep/40 bg-lime-pale px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[12px] font-bold tracking-tight text-ink">
            Appraisal snapshot
          </h2>
          <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
            {appraisal.period}
          </span>
        </div>
        <p className="text-[9px] text-muted">
          {appraisal.role} · reports to {appraisal.manager}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-paper px-2 py-2.5">
            <p className="text-[16px] font-bold leading-none tracking-tight text-ink">
              {appraisal.assigned.done}/{appraisal.assigned.total}
            </p>
            <p className="mt-1 text-[8px] font-semibold text-inksoft">tasks done</p>
          </div>
          <div className="rounded-xl bg-paper px-2 py-2.5">
            <p className="text-[16px] font-bold leading-none tracking-tight text-ink">
              {appraisal.assigned.onTime}
            </p>
            <p className="mt-1 text-[8px] font-semibold text-inksoft">on time</p>
          </div>
          <div className="rounded-xl bg-paper px-2 py-2.5">
            <p className="text-[16px] font-bold leading-none tracking-tight text-ink">
              {streak.current}
            </p>
            <p className="mt-1 text-[8px] font-semibold text-inksoft">day streak</p>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {appraisal.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-1.5">
              <CheckCircle2 className="mt-px h-3 w-3 shrink-0 text-lime-deep" />
              <span className="text-[9.5px] leading-[1.5] text-inksoft">{o}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-lime px-3.5 py-3">
          <p className="text-[17px] font-bold leading-none tracking-tight text-ink">40%</p>
          <p className="mt-1 text-[9px] font-bold text-ink">faster onboarding</p>
          <p className="mt-0.5 text-[8px] text-inksoft">5 days → 3 · 12 new hires</p>
        </div>
        <div className="rounded-2xl bg-lime px-3.5 py-3">
          <p className="text-[17px] font-bold leading-none tracking-tight text-ink">6h/wk</p>
          <p className="mt-1 text-[9px] font-bold text-ink">estimated time saved</p>
          <p className="mt-0.5 text-[8px] text-inksoft">Across 3 workflows</p>
        </div>
      </div>

      <h2 className="mb-2.5 text-[13px] font-bold tracking-tight text-ink">
        Small steps. Tangible impact.
      </h2>
      <div className="mb-5 space-y-2.5">
        {portfolioWins.map((win) => (
          <article key={win.title} className="card px-4 py-3.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
              {win.meta}
            </p>
            <h3 className="mt-1 text-[13px] font-bold tracking-tight text-ink">{win.title}</h3>
            <p className="mt-1 inline-block rounded-md bg-lime-soft px-2 py-1 text-[10px] font-bold text-ink">
              {win.highlight}
            </p>
            <p className="mt-2 text-[10px] leading-[1.6] text-inksoft">{win.body}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {win.skills.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </article>
        ))}
      </div>

      <h2 className="mb-2.5 text-[13px] font-bold tracking-tight text-ink">
        Digital skills. In context.
      </h2>
      <div className="card mb-5 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-ink">Skills assessments</p>
          <span className="rounded-full bg-cream px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
            Coming soon
          </span>
        </div>
        <p className="mt-1 text-[9.5px] leading-[1.55] text-muted">
          Short tests will score your digital skills and add verified results here.
        </p>
      </div>

      <h2 className="mb-1.5 text-[13px] font-bold tracking-tight text-ink">
        Let&apos;s talk about what&apos;s next.
      </h2>
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-medium text-inksoft">
        <Mail className="h-3 w-3 text-muted" /> {user.email}
      </p>
      <PortfolioDownloadButton />

      <p className="mt-5 text-center text-[8px] leading-[1.6] text-faint">
        Assessments verified where noted. Other metrics are self-reported. Evidence shared with
        permission. Built with onWard.
      </p>
    </PhoneShell>
  );
}
