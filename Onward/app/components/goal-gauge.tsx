import { TrendingUp } from "lucide-react";

/**
 * Dotted-arc "Goals reached today" gauge — the reference dashboard's hero,
 * adapted to onWard's lime/cream palette. Fills clockwise from the left.
 */
export function GoalGauge({
  percent,
  doneCount,
  total,
  yesterday,
  caption = "Goals reached today",
}: {
  percent: number;
  doneCount: number;
  total: number;
  yesterday?: number;
  caption?: string;
}) {
  const cx = 100;
  const cy = 96;
  const R = 76;
  const N = 44;
  const gap = 96; // opening at the bottom, in degrees
  const start = -(180 - gap / 2);
  const end = 180 - gap / 2;
  const fillCount = Math.round((Math.min(100, Math.max(0, percent)) / 100) * N);

  const at = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  };

  const dots = Array.from({ length: N }, (_, i) => {
    const t = start + ((end - start) * i) / (N - 1);
    const { x, y } = at(t, R);
    return { x, y, filled: i < fillCount };
  });

  const tr = R + 14;
  const s = at(-64, tr);
  const e = at(64, tr);
  const arc = `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${tr} ${tr} 0 0 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;

  const improved = yesterday != null && percent > yesterday;

  return (
    <div className="card px-4 pb-4 pt-3">
      <div className="relative mx-auto h-[150px] w-full max-w-[260px]">
        <svg
          viewBox="0 0 200 150"
          className="h-full w-full"
          role="img"
          aria-label={`${caption}: ${percent} percent`}
        >
          <defs>
            <path id="goalGaugeArc" d={arc} />
          </defs>
          <text
            className="fill-muted"
            style={{ fontSize: 8.5, letterSpacing: 1.6, fontWeight: 700 }}
          >
            <textPath href="#goalGaugeArc" startOffset="50%" textAnchor="middle">
              {caption.toUpperCase()}
            </textPath>
          </text>
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={d.x.toFixed(1)}
              cy={d.y.toFixed(1)}
              r={3.1}
              className={d.filled ? "fill-lime-deep" : "fill-line"}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-7">
          <span className="text-[40px] font-extrabold leading-none tracking-tight text-ink">
            {percent}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Percent
          </span>
        </div>
      </div>

      <p className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted">
        {improved ? (
          <TrendingUp className="h-3.5 w-3.5 text-lime-deep" strokeWidth={2.4} />
        ) : null}
        <span>
          {doneCount} of {total} done
          {yesterday != null ? ` · was ${yesterday}% yesterday` : ""}
        </span>
      </p>
    </div>
  );
}
