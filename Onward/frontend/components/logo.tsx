export function LogoMark({
  dark = false,
  className = "h-8 w-8",
}: {
  dark?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={dark ? "#C9F24E" : "#B4E13A"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}

export function Logo({
  dark = false,
  className = "",
}: {
  dark?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark dark={dark} className="h-7 w-7 shrink-0" />
      <span
        className={`inline-flex items-end gap-1.5 whitespace-nowrap text-[19px] font-bold leading-none tracking-tight ${
          dark ? "text-paper" : "text-ink"
        }`}
      >
        <span>
          <span className={dark ? "text-lime" : "text-lime-deep"}>o</span>nWard
        </span>
        <span className="flex translate-y-[1px] gap-px flex-col items-start leading-[1.05]">
          <span
            className={`text-[5px] font-medium ${
              dark ? "text-paper/55" : "text-muted"
            }`}
          >
            by
          </span>
          <span
            className={`text-[7px] font-bold leading-none ${
              dark ? "text-paper/85" : "text-ink/80"
            }`}
          >
            GIGS Labs
          </span>
        </span>
      </span>
    </span>
  );
}
