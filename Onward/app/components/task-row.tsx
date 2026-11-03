"use client";

import { useState } from "react";
import { AlarmClock, Check, ChevronDown, X } from "lucide-react";
import { useStore } from "@/components/store";
import { useTaskComposer } from "@/components/task-composer";
import { BASE_DATE, type Task } from "@/lib/data";
import { dueState, formatExpiry } from "@/lib/dates";
import { INDENT_PX, parseNote, stepProgress, toggleLine } from "@/lib/checklist";
import { haptic } from "@/lib/haptics";

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

export function TaskRow({ task }: { task: Task }) {
  const { toggleTask, updateTask, settings } = useStore();
  const composer = useTaskComposer();
  const steps = stepProgress(task.steps);
  // Each step keeps its own index in the source, so ticking one rewrites exactly
  // that line rather than the nth item of a list that may hold blanks.
  const items = parseNote(task.steps ?? "").flatMap((line, index) =>
    line.kind === "item" && line.text.trim() ? [{ index, line }] : [],
  );
  // One step is already visible in the count, so only a real list is worth
  // unfolding — and folding back keeps the list short.
  const foldable = Boolean(steps && steps.total > 1);
  const [open, setOpen] = useState(false);

  const tickStep = (index: number) => {
    if (!task.steps) return;
    updateTask(task.id, { steps: toggleLine(task.steps, index) }, { fail: "Couldn't save the step" });
    haptic("success", settings.haptics);
  };

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
        <DueLine task={task} />
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
      {foldable ? (
        <button
          type="button"
          aria-label={
            open
              ? `Hide the subtasks of ${task.title}`
              : `Show the ${steps?.total} subtasks of ${task.title}`
          }
          aria-expanded={open}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((value) => !value);
          }}
          className={`-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-cream ${
            open ? "text-ink" : "text-muted"
          }`}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            strokeWidth={2.2}
          />
        </button>
      ) : null}
    </>
  );

  return (
    <div className="card transition active:scale-[0.995]">
      {/* The card opens the composer sheet, the same one New task brings up. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Edit ${task.title}`}
        onClick={() => composer.open(task.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            composer.open(task.id);
          }
        }}
        className="flex cursor-pointer items-center gap-3 px-3.5 py-3"
      >
        {inner}
      </div>
      {foldable && open ? (
        <div className="mx-3.5 mb-1 mt-0.5 space-y-0.5 border-t border-line pt-2">
          {items.map(({ index, line }) => (
            <button
              key={index}
              type="button"
              aria-label={
                line.done
                  ? `Mark "${line.text}" not done`
                  : `Mark "${line.text}" done`
              }
              aria-pressed={line.done}
              onClick={(e) => {
                e.preventDefault();
                tickStep(index);
              }}
              className="group flex w-full items-start gap-2.5 rounded-lg px-1 py-1 text-left transition hover:bg-cream"
              style={{ paddingLeft: `${(line.depth ?? 0) * INDENT_PX + 4}px` }}
            >
              <span
                className={`mt-[3px] flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[5px] border-2 transition ${
                  line.done
                    ? "border-lime-deep bg-lime"
                    : "border-dash bg-paper group-hover:border-lime-deep"
                }`}
              >
                {line.done ? (
                  <Check className="h-2.5 w-2.5 text-dark" strokeWidth={3} />
                ) : null}
              </span>
              <span
                className={`min-w-0 flex-1 text-[11.5px] leading-[1.55] [overflow-wrap:anywhere] ${
                  line.done ? "text-faint line-through" : "text-inksoft"
                }`}
              >
                {line.text}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
