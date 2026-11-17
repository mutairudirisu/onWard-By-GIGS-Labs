"use client";

import { PhoneShell } from "@/components/phone-shell";
import { PortfolioDetails } from "@/components/portfolio-details";
import { PortfolioShareControls } from "@/components/portfolio-share-controls";
import { PortfolioDownloadButton, usePortfolio } from "@/components/portfolio-download";
import { BackButton, Button } from "@/components/ui";
import { Wordmark } from "@/components/wordmark";
import { ArrowRight, FileText, Mail, Sprout } from "lucide-react";

export default function EmployerPortfolioPage() {
  const portfolio = usePortfolio();

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

      <PortfolioDetails portfolio={portfolio} />
      <PortfolioShareControls />

      <h2 className="mb-1.5 text-[13px] font-bold tracking-tight text-ink">
        Let&apos;s talk about what&apos;s next.
      </h2>
      {portfolio.email ? (
        <p className="mb-3 flex items-center gap-1.5 text-[10px] font-medium text-inksoft">
          <Mail className="h-3 w-3 text-muted" /> {portfolio.email}
        </p>
      ) : null}
      <PortfolioDownloadButton portfolio={portfolio} />

      <div className="mt-2 border-t border-line pt-3">
        <Button
          href="/cv"
          variant="primary"
          iconLeft={<FileText className="h-4 w-4" />}
          icon={<ArrowRight className="h-4 w-4" />}
          className="!justify-between !rounded-xl !px-4 !py-3 text-[11px] shadow-sm"
        >
          Turn these wins into a CV
        </Button>
      </div>

      <p className="mt-5 text-center text-[8px] leading-[1.6] text-faint">
        Metrics are self-reported from the work logged in onWard. Built with onWard.
      </p>
    </PhoneShell>
  );
}
