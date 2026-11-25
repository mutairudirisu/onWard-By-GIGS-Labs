import { FileText } from "lucide-react";
import { Tag } from "@/components/ui/ui";
import { Avatar } from "@/components/feed/feed-post";
import type { PortfolioModel } from "@/lib/portfolio";

export function PortfolioDetails({ portfolio }: { portfolio: PortfolioModel }) {
  return (
    <>
      <section className="mb-5">
        <div className="mb-3">
          <Avatar initials={portfolio.initials} src={portfolio.avatarUrl} size="lg" />
        </div>
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink">
          {portfolio.name}
        </h1>
        {portfolio.role ? (
          <p className="mt-1 text-[11px] font-semibold text-inksoft">{portfolio.role}</p>
        ) : null}
        {portfolio.location ? (
          <p className="text-[9px] text-muted">{portfolio.location}</p>
        ) : null}
        {portfolio.bio ? (
          <p className="mt-3 text-[10.5px] leading-[1.6] text-inksoft">{portfolio.bio}</p>
        ) : null}
      </section>

      <section className="mb-5 rounded-2xl border border-lime-deep/40 bg-lime-pale px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[12px] font-bold tracking-tight text-ink">Proof at a glance</h2>
          <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
            {portfolio.activeDays} active days
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {portfolio.stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-paper px-2 py-2.5">
              <p className="text-[16px] font-bold leading-none tracking-tight text-ink">
                {stat.value}
              </p>
              <p className="mt-1 text-[8px] font-semibold leading-tight text-inksoft">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {portfolio.headline.length ? (
        <div className="mb-5 grid grid-cols-2 gap-2">
          {portfolio.headline.map((win) => (
            <div key={win.id} className="rounded-2xl bg-lime px-3.5 py-3">
              <p className="text-[11.5px] font-bold leading-snug text-dark">{win.impact}</p>
              <p className="mt-1 text-[8px] font-semibold leading-tight text-dark/70">
                {win.title}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <h2 className="mb-2.5 text-[13px] font-bold tracking-tight text-ink">
        Small steps. Tangible impact.
      </h2>
      {portfolio.wins.length ? (
        <div className="mb-5 space-y-2.5">
          {portfolio.wins.map((win) => (
            <article key={win.id} className="card px-4 py-3.5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted">
                {win.meta}
              </p>
              <h3 className="mt-1 text-[13px] font-bold tracking-tight text-ink">{win.title}</h3>
              <p className="mt-1 inline-block rounded-md bg-lime-soft px-2 py-1 text-[10px] font-bold text-ink">
                {win.impact}
              </p>
              {win.body ? (
                <p className="mt-2 text-[10px] leading-[1.6] text-inksoft">{win.body}</p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {win.skills.map((skill) => (
                  <Tag key={skill}>{skill}</Tag>
                ))}
                {win.evidence ? (
                  <span className="flex items-center gap-1 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-muted">
                    <FileText className="h-3 w-3" />
                    {win.evidence} evidence
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card mb-5 px-4 py-6 text-center">
          <p className="text-[12px] font-semibold text-ink">No wins in the portfolio yet</p>
          <p className="tiny mt-1">
            Log an onWard to start building evidence of your progress.
          </p>
        </div>
      )}

      <h2 className="mb-2.5 text-[13px] font-bold tracking-tight text-ink">
        Skills. Shown by the work.
      </h2>
      <div className="card mb-5 px-4 py-3.5">
        {portfolio.skills.length ? (
          <ul className="space-y-3">
            {portfolio.skills.map((skill) => (
              <li key={skill.name}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-semibold text-ink">
                    {skill.name}
                  </span>
                  <span className="shrink-0 text-[8.5px] font-bold uppercase tracking-[0.1em] text-muted">
                    {skill.stage} · {skill.count} win{skill.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-lime-deep"
                    style={{ width: `${skill.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] leading-[1.55] text-muted">
            Skills appear here as you tag them on your onWards.
          </p>
        )}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-[10px] font-semibold text-inksoft">Skills assessments</p>
          <span className="rounded-full bg-cream px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
            Coming soon
          </span>
        </div>
      </div>
    </>
  );
}
