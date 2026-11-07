/**
 * The brand's first letter is a mark, not a glyph: a ring of eight lime blocks.
 * It is sized in em, so it follows whatever wordmark it sits in, and it hangs off
 * the baseline - the bottom edge is the text baseline - which leaves it standing a
 * little above the lowercase, the way the mark does in the lockup.
 */
function DottedO({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`mr-[0.04em] inline-block h-[0.7em] w-[0.6em] align-baseline ${className}`}
    >
      <ellipse
        cx="12"
        cy="12"
        rx="8.8"
        ry="10.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeDasharray="4.2 3.31"
      />
    </svg>
  );
}

export function Wordmark({
  className = "",
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "paper";
}) {
  return (
    <span
      className={`font-bold tracking-tight ${
        tone === "paper" ? "text-on-panel" : "text-ink"
      } ${className}`}
    >
      <DottedO className={tone === "paper" ? "text-lime" : "text-lime-deep"} />
      nWard
    </span>
  );
}
