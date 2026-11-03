"use client";

import Link from "next/link";
import { AlarmClock, Check, X } from "lucide-react";
import { useStore } from "@/components/store";
import { BASE_DATE, type Task } from "@/lib/data";
import { dueState, formatExpiry } from "@/lib/dates";
import { stepProgress } from "@/lib/checklist";

/** When the task falls due — the line that replaces the old list name. */
function DueLine({ task }: { task: Task }) {
  const { updateTask } = useStore();
  const iso = task.date ?? BASE_DATE;
  const state = dueState(iso, task.time);
  // Red means a nudge was missed. A task with no time is merely late, so it stays
  // muted and offers nothing to silence.
  const missed = state === "Expired" && !task.done && Boolean(task.time);
  return (
    <span
      className={`flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[10px] transition-colors ${
        missed ? "font-semibold text-[#E5484D]" : task.done ? "text-faint/80" : "text-muted"
      }`}
    >
      <span className="shrink-0">{formatExpiry(iso, task.time)}</span>
      <span aria-hidden className="shrink-0">
        ·
      </span>
      <span className="shrink-0">{state}</span>
      {missed ? <AlarmClock className="h-3 w-3 shrink-0" strokeWidth={2.2} /> : null}
      {missed ? (
        <button
          type="button"
          aria-label={`Silence the reminder for ${task.title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateTask(
              task.id,
              { time: undefined },
              { ok: "Reminder silenced", fail: "Couldn't silence the reminder" },
            );
          }}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition hover:bg-[#E5484D]/10"
        >
          <X className="h-3 w-3" strokeWidth={2.6} />
        </button>
      ) : null}
    </span>
  );
}

export function TaskRow({
  task,
  sub,
  href,
}: {
  task: Task;
  sub?: string;
  href?: string;
}) {
  const { toggleTask } = useStore();
  const to = href ?? `/tasks/${task.id}`;
  const steps = stepProgress(task.steps);

  const inner = (
    <>
      <button
        type="button"
        aria-label={task.done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
        aria-pressed={task.done}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleTask(task.id);
        }}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
          task.done ? "border-lime-deep bg-lime" : "border-dash bg-paper hover:border-lime-deep"
        }`}
      >
        {task.done ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
      </button>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[12px] font-semibold transition-colors ${
            task.done ? "text-faint line-through" : "text-ink"
          }`}
        >
          {task.title}
        </span>
        {sub ? (
          <span
            className={`block truncate text-[10px] transition-colors ${
              task.done ? "text-faint/80" : "text-muted"
            }`}
          >
            {sub}
          </span>
        ) : (
          <DueLine task={task} />
        )}
      </span>
      {steps ? (
        <span
          className={`shrink-0 self-center rounded-full px-2 py-1 text-[10px] font-bold tabular-nums ${
            steps.done === steps.total
              ? "bg-lime text-dark"
              : task.done
                ? "bg-cream text-faint"
                : "bg-lime-soft text-inksoft"
          }`}
        >
          {steps.done}/{steps.total}
        </span>
      ) : null}
    </>
  );

  return (
    <Link
      href={to}
      className="card flex items-center gap-3 px-3.5 py-3 transition active:scale-[0.995]"
    >
      {inner}
    </Link>
  );
}
