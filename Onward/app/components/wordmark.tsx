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
        tone === "paper" ? "text-paper" : "text-ink"
      } ${className}`}
    >
      <span className={tone === "paper" ? "text-lime" : "text-lime-deep"}>o</span>nWard
    </span>
  );
}
