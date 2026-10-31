"use client";

import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/phone-shell";
import { PortfolioDownloadButton, usePortfolio } from "@/components/portfolio-download";
import { BackLink, Button, Chip, Field, TextInput, Toggle } from "@/components/ui";
import { ChevronDown, Eye, Globe, Lock, Minus } from "lucide-react";

const AUDIENCES = ["Employers", "Agencies", "Personal"];

export default function SharePortfolioPage() {
  const [audience, setAudience] = useState("Employers");
  const portfolio = usePortfolio();
  const includes = useMemo(
    () => [
      {
        id: "achievements",
        title: "Selected achievements",
        meta: `${portfolio.wins.length} onWard${portfolio.wins.length === 1 ? "" : "s"} in the portfolio`,
        initial: true,
      },
      {
        id: "skills",
        title: "Skills & work examples",
        meta: `${portfolio.skills.length} skill${portfolio.skills.length === 1 ? "" : "s"} tracked`,
        initial: true,
      },
      {
        id: "tests",
        title: "Digital skills test results",
        meta: "Coming soon - nothing verified yet",
        initial: false,
      },
      {
        id: "evidence",
        title: "Evidence attachments",
        meta: `${portfolio.wins.reduce((n, w) => n + w.evidence, 0)} files and links`,
        initial: false,
      },
    ],
    [portfolio],
  );
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(includes.map((i) => [i.id, i.initial]))
  );

  return (
    <PhoneShell>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BackLink href="/profile" label="Back to profile" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Your portfolio</h1>
        </div>
        <button type="button" aria-label="Collapse" className="text-inksoft">
          <Minus className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <Field label="Portfolio title" uppercase>
          <TextInput defaultValue={`${portfolio.name.split(" ")[0]}'s work portfolio`} />
        </Field>

        <div>
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            What&apos;s this for?
          </span>
          <div className="flex gap-2">
            {AUDIENCES.map((a) => (
              <Chip key={a} active={audience === a} onClick={() => setAudience(a)}>
                {a}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-muted">
            Employers see projects and outcomes, plus verified skills.
          </p>
        </div>

        <section className="card px-4 py-3.5">
          <h2 className="mb-3 text-[12px] font-bold tracking-tight text-ink">What to include</h2>
          <div className="space-y-3.5">
            {includes.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-[11px] font-semibold text-ink">{item.title}</span>
                  <span className="block text-[9px] text-muted">{item.meta}</span>
                </span>
                <Toggle
                  checked={toggles[item.id]}
                  onChange={(v) => setToggles((t) => ({ ...t, [item.id]: v }))}
                  label={item.title}
                />
              </div>
            ))}
          </div>
        </section>

        <div>
          <Field label="Share settings" uppercase>
            <button type="button" className="field-input flex items-center justify-between text-left">
              Anyone with the link
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>
          </Field>
          <p className="mt-1.5 flex items-start gap-1.5 text-[9px] leading-[1.5] text-muted">
            <Lock className="mt-px h-3 w-3 shrink-0" />
            Link viewers see a read-only version. You can revoke access anytime.
          </p>
        </div>

        <Button href="/portfolio" variant="secondary" iconLeft={<Eye className="h-4 w-4" />}>
          Preview portfolio
        </Button>

        <div className="grid grid-cols-2 gap-2.5">
          <PortfolioDownloadButton portfolio={portfolio} label="Download PDF" className="w-full" />
          <Button href="/portfolio" iconLeft={<Globe className="h-4 w-4" />}>
            Create share link
          </Button>
        </div>

        <div className="rounded-xl border border-dashed border-dash px-4 py-3 text-center">
          <p className="text-[9px] leading-[1.6] text-muted">
            Your portfolio stays private until you create a share link. You stay in control of
            every detail.
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}
