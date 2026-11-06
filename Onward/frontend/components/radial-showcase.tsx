import {
  BarChart3,
  Flame,
  FolderOpen,
  Plus,
  Sprout,
} from "lucide-react";
import { Logo } from "@/components/logo";

/* One tone for all four: the point is that they belong to the same record, not
   that each corner of the app has its own colour. */
const NODES = [
  { label: "onWards", Icon: Sprout, angle: -90 },
  { label: "Skills", Icon: BarChart3, angle: 0 },
  { label: "Portfolio", Icon: FolderOpen, angle: 90 },
  { label: "Streaks", Icon: Flame, angle: 180 },
];

const R = 40;
const C = 50;

export function RadialShowcase() {
  return (
    // The inset keeps the top and bottom node labels inside the box on a 360px
    // screen, where they used to overhang the heading above and below.
    <div id="how" className="relative mx-auto aspect-square w-[calc(100%-2rem)] max-w-[560px]">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {NODES.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = C + R * Math.cos(rad);
          const y = C + R * Math.sin(rad);
          return (
            <line
              key={n.label}
              x1={C}
              y1={C}
              x2={x}
              y2={y}
              stroke="#C9CABC"
              strokeWidth="0.4"
              strokeDasharray="1.6 1.6"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-paper shadow-lift sm:h-44 sm:w-44">
        <Logo dark className="scale-[0.8] sm:scale-90" />
        <span
          className="absolute -bottom-2 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-lime text-ink shadow-lift ring-4 ring-mist"
          title="One tap to create"
        >
          <Plus className="h-5 w-5" strokeWidth={2.6} />
        </span>
      </div>
      {NODES.map((n) => {
        const rad = (n.angle * Math.PI) / 180;
        const left = `${C + R * Math.cos(rad)}%`;
        const top = `${C + R * Math.sin(rad)}%`;
        return (
          <div
            key={n.label}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left, top }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-lime-deep/30 bg-lime-soft text-ink shadow-card sm:h-14 sm:w-14">
                <n.Icon className="h-5 w-5 text-lime-deep sm:h-6 sm:w-6" strokeWidth={2.1} />
              </span>
              <span className="rounded-full bg-paper px-3 py-1 text-[11px] font-semibold text-ink/70">
                {n.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
