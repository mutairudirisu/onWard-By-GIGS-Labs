/**
 * The brand's first letter is a mark, not a glyph: a ring of eight lime blocks.
 * Sized in em and hung off the baseline, so it follows the wordmark it sits in.
 */
export function DottedO({ className = "" }: { className?: string }) {
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
  suffix = "Admin",
}: {
  className?: string;
  suffix?: string;
}) {
  return (
    <span className={`font-bold tracking-tight text-ink ${className}`}>
      <DottedO className="text-lime-deep" />nWard
      {suffix ? (
        <span className="ml-1.5 rounded-md bg-ink px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-paper">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
