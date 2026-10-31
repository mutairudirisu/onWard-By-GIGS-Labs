import {
  Flame,
  FolderOpen,
  ListTodo,
  NotebookPen,
  Plus,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Logo } from "@/components/logo";

const NODES = [
  { label: "Tasks", Icon: ListTodo, angle: -90, color: "#2F6FED" },
  { label: "Notes", Icon: NotebookPen, angle: -30, color: "#7C3AED" },
  { label: "Streaks", Icon: Flame, angle: 30, color: "#F97316" },
  { label: "Wins", Icon: Trophy, angle: 90, color: "#D9A400" },
  { label: "Skills", Icon: Sparkles, angle: 150, color: "#E11D8F" },
  { label: "Portfolio", Icon: FolderOpen, angle: 210, color: "#0E9F8E" },
];

const R = 40;
const C = 50;

export function RadialShowcase() {
  return (
    <div id="how" className="relative mx-auto aspect-square w-full max-w-[620px]">
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
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full border bg-paper shadow-card sm:h-16 sm:w-16"
                style={{ color: n.color, borderColor: `${n.color}33`, backgroundColor: `${n.color}0F` }}
              >
                <n.Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.1} />
              </span>
              <span className="rounded-full bg-mist px-3 py-1 text-[11px] font-semibold text-ink/70">
                {n.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
