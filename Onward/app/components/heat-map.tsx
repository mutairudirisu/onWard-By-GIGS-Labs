import { heatmap } from "@/lib/data";

const LEVEL: Record<number, string> = {
  0: "bg-[#EDEEE8]",
  1: "bg-lime/30",
  2: "bg-lime/55",
  3: "bg-lime/80",
  4: "bg-lime",
};

export function HeatMap({ cell = 11 }: { cell?: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {heatmap.map((col, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {col.map((c) => (
              <span
                key={c.date}
                title={`${c.level} onWard${c.level === 1 ? "" : "s"} · ${c.date}`}
                className={`rounded-[3px] ${LEVEL[c.level]}`}
                style={{ width: cell, height: cell }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatLegend() {
  return (
    <div className="flex items-center gap-1.5 text-[9px] text-muted">
      <span>Less</span>
      {[0, 1, 2, 3, 4].map((l) => (
        <span key={l} className={`h-[10px] w-[10px] rounded-[3px] ${LEVEL[l]}`} />
      ))}
      <span>More</span>
    </div>
  );
}
