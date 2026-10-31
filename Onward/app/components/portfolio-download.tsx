"use client";

import { Button } from "@/components/ui";
import { useCurrentUser } from "@/components/auth";
import { useActivity } from "@/lib/activity";
import { useStore } from "@/components/store";
import { buildPortfolio, type PortfolioModel } from "@/lib/portfolio";
import { buildPortfolioPdf, portfolioFileName } from "@/lib/portfolio-pdf";
import { Download } from "lucide-react";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** The preview and the PDF read from this one model, so they cannot drift apart. */
export function usePortfolio(): PortfolioModel {
  const user = useCurrentUser();
  const { onWards, skills } = useStore();
  const { days, streak } = useActivity();
  return buildPortfolio({ user, onWards, skills, days, streak });
}

export function PortfolioDownloadButton({
  portfolio,
  label = "Download portfolio PDF",
  variant = "secondary",
  className,
}: {
  portfolio: PortfolioModel;
  label?: string;
  variant?: "primary" | "secondary" | "quiet" | "dark";
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      className={className}
      iconLeft={<Download className="h-4 w-4" />}
      onClick={() =>
        download(buildPortfolioPdf(portfolio), portfolioFileName(portfolio.name))
      }
    >
      {label}
    </Button>
  );
}
