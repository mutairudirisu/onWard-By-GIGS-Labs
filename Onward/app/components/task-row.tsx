"use client";

import Link from "next/link";
import { AlarmClock, Check } from "lucide-react";
import { useStore } from "@/components/store";
import { BASE_DATE, type Task } from "@/lib/data";
import { dueState, formatClock, formatDue } from "@/lib/dates";

/** When the task falls due — the line that replaces the old list name. */
function DueLine({ task }: { task: Task }) {
  const iso = task.date ?? BASE_DATE;
  const state = dueState(iso, task.time);
  const overdue = state === "Expired" && !task.done;
  return (
    <span
      className={`flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[10px] transition-colors ${
        task.done ? "text-faint/80" : "text-muted"
      }`}
    >
      <span className="shrink-0">
        {formatDue(iso)}
        {task.time ? ` ${formatClock(task.time)}` : ""}
      </span>
      <span aria-hidden className="shrink-0">
        ·
      </span>
      <span className="shrink-0">{state}</span>
      {overdue ? <AlarmClock className="h-3 w-3 shrink-0" strokeWidth={2.2} /> : null}
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
