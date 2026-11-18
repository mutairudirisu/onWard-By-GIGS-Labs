"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/modal";
import { useCurrentUser } from "@/components/auth";
import { useActivity } from "@/lib/activity";
import { useStore } from "@/components/store";
import { downloadBlob } from "@/lib/download";
import { buildPortfolio, type PortfolioModel } from "@/lib/portfolio";
import { buildPortfolioPdf, portfolioFileName } from "@/lib/portfolio-pdf";
import { Download, UserRoundPlus } from "lucide-react";

/** The preview and the PDF read from this one model, so they cannot drift apart. */
export function usePortfolio(): PortfolioModel {
  const user = useCurrentUser();
  const { onWards, skills } = useStore();
  const { days, streak } = useActivity();
  return buildPortfolio({ user, onWards, skills, days, streak });
}

/** The bits of biodata an employer looks for first. */
const PROFILE_FIELDS = [
  { key: "role", label: "your role" },
  { key: "location", label: "where you are based" },
  { key: "bio", label: "a short bio" },
] as const;

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
  const [asking, setAsking] = useState(false);
  const missing = PROFILE_FIELDS.filter((field) => !portfolio[field.key]);

  const downloadPdf = () => {
    setAsking(false);
    downloadBlob(buildPortfolioPdf(portfolio), portfolioFileName(portfolio.name));
  };

  return (
    <>
      <Button
        variant={variant}
        className={className}
        iconLeft={<Download className="h-4 w-4" />}
        onClick={() => (missing.length ? setAsking(true) : downloadPdf())}
      >
        {label}
      </Button>

      <Modal open={asking} onClose={() => setAsking(false)} title="Add these first?">
        <div className="flex flex-col gap-4">
          <p className="text-[12.5px] leading-[1.6] text-inksoft">
            Your PDF is ready, but a portfolio reads much stronger with{" "}
            {missing.map((field) => field.label).join(", ")}. Nobody else sees this — you can
            still download it as it is.
          </p>
          <Button href="/profile/edit" iconLeft={<UserRoundPlus className="h-4 w-4" />}>
            Add my details
          </Button>
          <Button variant="quiet" onClick={downloadPdf}>
            Download anyway
          </Button>
        </div>
      </Modal>
    </>
  );
}
