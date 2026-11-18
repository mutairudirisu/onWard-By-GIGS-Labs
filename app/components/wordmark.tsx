function LogoMark() {
  return (
    <span className="inline-flex h-[1.15em] w-[1.15em] shrink-0 items-center justify-center rounded-[0.28em] bg-lime">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[78%] w-[78%]">
        <g
          fill="none"
          stroke="#20211A"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 20h10" />
          <path d="M10 20c5.5-2.5.8-6.4 3-10" />
          <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
          <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
        </g>
      </svg>
    </span>
  );
}

export function Wordmark({
  className = "",
  tone = "ink",
  showMark = true,
}: {
  className?: string;
  tone?: "ink" | "paper";
  showMark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-[0.16em] font-brand font-bold tracking-tight ${
        tone === "paper" ? "text-on-panel" : "text-ink"
      } ${className}`}
    >
      {showMark ? <LogoMark /> : null}
      <span>
        <span className="text-lime-deep">o</span>nWard
      </span>
    </span>
  );
}
