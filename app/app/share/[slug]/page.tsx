"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/ui";
import { PhoneShell } from "@/components/layout/phone-shell";
import { PortfolioDetails } from "@/components/portfolio/portfolio-details";
import { useAuth } from "@/components/providers/auth";
import { Wordmark } from "@/components/ui/wordmark";
import { fetchSharedPortfolio } from "@/lib/portfolio-share";
import type { PortfolioModel } from "@/lib/portfolio";

function message(error: unknown) {
  return error instanceof Error ? error.message : "This portfolio could not be loaded.";
}

export default function SharedPortfolioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioModel | null | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setPortfolio(undefined);
    setError("");
    fetchSharedPortfolio(slug)
      .then((result) => {
        if (active) setPortfolio(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      });
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <PhoneShell>
      <div className="mb-5 flex items-center justify-between">
        <Wordmark className="text-[12px]" />
        <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
          Shared work portfolio
        </span>
      </div>

      {error ? (
        <div role="alert" className="card px-4 py-6 text-center">
          <p className="text-[12px] font-semibold text-ink">We couldn&apos;t load this portfolio</p>
          <p className="tiny mt-1">{error}</p>
        </div>
      ) : portfolio === undefined ? (
        <div className="card flex min-h-36 items-center justify-center px-4 py-6">
          <p className="text-[11px] text-muted">Loading portfolio…</p>
        </div>
      ) : portfolio === null ? (
        <div className="card px-4 py-6 text-center">
          <p className="text-[12px] font-semibold text-ink">This portfolio is unavailable</p>
          <p className="tiny mt-1">The owner may have turned off this share link.</p>
        </div>
      ) : (
        <>
          <PortfolioDetails portfolio={portfolio} />
          <section className="mb-5 rounded-2xl bg-lime-pale px-4 py-4 text-center">
            <h2 className="text-[13px] font-bold text-ink">Want to make your work visible too?</h2>
            <p className="mt-1 text-[10px] leading-[1.55] text-inksoft">
              Join onWard to log your progress and connect with the people behind the work.
            </p>
            <Button
              href={user ? "/feed" : "/create-account"}
              variant="primary"
              className="mt-3 !w-full !justify-center !rounded-xl !py-2.5 text-[10px]"
            >
              {user ? "Explore onWard" : "Create your free account"}
            </Button>
          </section>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button href="/feed" variant="secondary" className="!justify-center !rounded-xl !py-2.5 text-[10px]">
          Browse the feed
        </Button>
        <Button
          href="/communities"
          variant="secondary"
          className="!justify-center !rounded-xl !py-2.5 text-[10px]"
        >
          Explore communities
        </Button>
      </div>
      <p className="mt-5 text-center text-[8px] leading-[1.6] text-faint">
        This is a read-only portfolio. Sign up to interact on onWard.
      </p>
    </PhoneShell>
  );
}
