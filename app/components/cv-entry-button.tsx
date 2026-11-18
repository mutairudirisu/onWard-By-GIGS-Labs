import type { ReactNode } from "react";
import { Button } from "@/components/ui";

export function CvEntryButton({
  children,
  variant = "secondary",
  iconLeft,
  icon,
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet" | "dark";
  iconLeft?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const production = process.env.NODE_ENV === "production";

  return (
    <Button
      href={production ? undefined : "/cv"}
      disabled={production}
      aria-disabled={production}
      variant={variant}
      iconLeft={iconLeft}
      icon={icon}
      className={`${className}${production ? " cursor-not-allowed opacity-75" : ""}`}
    >
      {children}
      {production ? (
        <span className="ml-auto shrink-0 rounded-full bg-cream px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
          Coming soon
        </span>
      ) : null}
    </Button>
  );
}
