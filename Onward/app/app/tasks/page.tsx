"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { TaskRow } from "@/components/task-row";
import { SortableTaskList } from "@/components/sortable-task-list";
import { useTaskComposer } from "@/components/task-composer";
import { Chip, NewButton, PageHeader, ProgressBar } from "@/components/ui";
import { useStore } from "@/components/store";
import { BASE_DATE, type Task } from "@/lib/data";
import { formatTasksHeader } from "@/lib/dates";
import { ListChecks, Search, X } from "lucide-react";

const FILTERS = ["Today", "Upcoming", "All tasks"] as const;
type Filter = (typeof FILTERS)[number];

function inBucket(task: Task, filter: Filter, selectedDate: string) {
  if (task.archived) return false;
  const date = task.date ?? BASE_DATE;
  if (filter === "Today") return date === selectedDate;
  if (filter === "Upcoming") return date > selectedDate;
  return true;
}

export default function TasksPage() {
  const router = useRouter();
  const { tasks, selectedDate, restoreTask } = useStore();
  const composer = useTaskComposer();
  const [filter, setFilter] = useState<Filter>("Today");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setFilter("Today");
      composer.open();
      router.replace("/tasks");
    }
  }, [router, composer]);

  const q = query.trim().toLowerCase();
  const scoped = tasks.filter((t) => inBucket(t, filter, selectedDate));
  const visible = q
    ? scoped.filter(
        (t) => t.title.toLowerCase().includes(q) || t.meta.toLowerCase().includes(q),
      )
    : scoped;
  const open = visible.filter((t) => !t.done);
  const done = visible.filter((t) => t.done);
  const archived = filter === "All tasks" ? tasks.filter((t) => t.archived) : [];
  const total = scoped.length;
  const doneCount = scoped.filter((t) => t.done).length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  const startAdd = () => {
    setFilter("Today");
    composer.open();
  };

  const headerLabel =
    filter === "Today"
      ? formatTasksHeader(selectedDate)
      : filter === "Upcoming"
        ? "Coming up"
        : "Every task";

  return (
    <PhoneShell tab="tasks" wide>
      <PageHeader
        title="Your tasks"
        subtitle={filter === "Today" ? headerLabel : undefined}
        actions={
          <>
            <NewButton onClick={startAdd}>New task</NewButton>
            <button
              type="button"
              aria-label="Task options"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-inksoft hover:bg-cream lg:flex"
            >
              <ListChecks className="h-5 w-5" />
            </button>
          </>
        }
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              className="field-input pl-9 pr-9"
              placeholder="Find a task"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Find a task"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mb-4 flex gap-2">
            {FILTERS.map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                {f}
              </Chip>
            ))}
          </div>

          {filter === "Today" ? (
            <section className="mb-5 lg:hidden">
              <div className="flex items-end justify-between">
                <span className="text-[12px] font-bold text-ink">{headerLabel}</span>
                <span className="text-[19px] font-bold tracking-tight text-ink">{percent}%</span>
              </div>
              <p className="mb-2 mt-0.5 text-[10px] text-muted">
                {doneCount} of {total} complete · Good steps add up.
              </p>
              <ProgressBar value={percent} />
            </section>
          ) : null}

          <section className="mb-5">
            <div className="mb-2 flex items-end justify-between">
              <h2 className="text-[13px] font-bold tracking-tight text-ink lg:text-[15px]">
                Still to come
              </h2>
              <span className="text-[10px] font-semibold text-muted lg:text-[12px]">
                {open.length} tasks
              </span>
            </div>
            {open.length === 0 ? (
              <p className="card px-3.5 py-3 text-[11px] text-muted">
                {q ? "No matching tasks still to do." : "Nothing left here — nice work."}
              </p>
            ) : (
              <>
                <SortableTaskList tasks={open} />
                <p className="mt-2 text-center text-[9px] text-faint">
                  Slide a task right to archive, left to delete · hold to reorder
                </p>
              </>
            )}
          </section>

          {done.length > 0 ? (
            <section className="mb-5">
              <div className="mb-2 flex items-end justify-between">
                <h2 className="text-[13px] font-bold tracking-tight text-ink lg:text-[15px]">
                  Already done
                </h2>
                <span className="text-[10px] font-semibold text-muted lg:text-[12px]">
                  {done.length} tasks
                </span>
              </div>
              <SortableTaskList tasks={done} />
            </section>
          ) : null}

          {archived.length > 0 ? (
            <section className="mb-5">
              <div className="mb-2 flex items-end justify-between">
                <h2 className="text-[13px] font-bold tracking-tight text-ink lg:text-[15px]">
                  Archived
                </h2>
                <span className="text-[10px] font-semibold text-muted lg:text-[12px]">
                  {archived.length} tasks
                </span>
              </div>
              <div className="space-y-2">
                {archived.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <TaskRow task={task} />
                    </div>
                    <button
                      type="button"
                      onClick={() => restoreTask(task.id)}
                      className="flex shrink-0 items-center gap-1 rounded-full border border-dash bg-paper px-2.5 py-1.5 text-[10px] font-semibold text-inksoft hover:border-lime-deep"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {q && visible.length === 0 ? (
            <p className="mb-5 text-center text-[11px] text-muted">
              No tasks match &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : null}
        </div>

        <aside className="hidden space-y-4 lg:sticky lg:top-8 lg:block">
          {filter === "Today" ? (
            <section className="card px-5 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                {headerLabel}
              </p>
              <div className="mt-1 flex items-end justify-between">
                <span className="text-[34px] font-bold leading-none tracking-tight text-ink">
                  {percent}%
                </span>
              </div>
              <p className="mb-3 mt-1 text-[11px] text-muted">
                {doneCount} of {total} complete · Good steps add up.
              </p>
              <ProgressBar value={percent} />
            </section>
          ) : null}

          <section className="card px-5 py-4">
            <h3 className="mb-3 text-[12px] font-bold tracking-tight text-ink">At a glance</h3>
            <dl className="space-y-2.5">
              {[
                { label: "Still to come", value: open.length },
                { label: "Already done", value: done.length },
                { label: "Archived", value: archived.length },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <dt className="text-[12px] text-muted">{s.label}</dt>
                  <dd className="text-[15px] font-bold tracking-tight text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl bg-panel px-5 py-4 text-on-panel">
            <h3 className="text-[12px] font-bold">A calmer day</h3>
            <p className="mt-1 text-[11px] leading-[1.55] text-[#B7B8AC]">
              One clear priority beats ten open tabs. Drag the most important task to the top.
            </p>
          </section>
        </aside>
      </div>
    </PhoneShell>
  );
}
