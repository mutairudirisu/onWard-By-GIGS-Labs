export function Wordmark({
  className = "",
  suffix = "Admin",
}: {
  className?: string;
  suffix?: string;
}) {
  return (
    <span className={`font-bold tracking-tight text-ink ${className}`}>
      <span className="text-lime-deep">o</span>nWard
      {suffix ? (
        <span className="ml-1.5 rounded-md bg-ink px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-paper">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
