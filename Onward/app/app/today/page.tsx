"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/phone-shell";
import { GoalGauge } from "@/components/goal-gauge";
import { DateStrip } from "@/components/date-strip";
import { TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui";
import { useStore } from "@/components/store";
import { useCurrentUser } from "@/components/auth";
import { UnreadDot } from "@/components/notifications";
import { BASE_DATE } from "@/lib/data";
import { formatLong } from "@/lib/dates";
import { Bell, CalendarClock, ChevronRight, Plus } from "lucide-react";

export default function TodayPage() {
  const { tasks, selectedDate } = useStore();
  const user = useCurrentUser();
  const firstName = user.name.split(" ")[0] || "there";

  const dayTasks = tasks.filter((t) => (t.date ?? BASE_DATE) === selectedDate);
  const open = dayTasks.filter((t) => !t.done);
  const done = dayTasks.filter((t) => t.done);
  const total = dayTasks.length;
  const percent = total ? Math.round((done.length / total) * 100) : 0;
  const isBase = selectedDate === BASE_DATE;

  return (
    <PhoneShell tab="today" wide>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_auto_1fr] lg:gap-x-8">
        <div className="mb-4 lg:col-span-2 lg:mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted lg:text-[11px]">
            {formatLong(selectedDate)}
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <h1 className="text-[22px] font-bold tracking-tight text-ink lg:text-[32px]">
              Hi, {firstName}.
            </h1>
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                aria-label="Your profile"
                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-lime-soft text-[10px] font-bold text-ink"
              >
                {user.initials}
                <UnreadDot />
              </Link>
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
              >
                <Bell className="h-[18px] w-[18px]" />
                <UnreadDot />
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-3 lg:col-start-1 lg:row-start-2 lg:mb-5">
          <DateStrip />
        </div>

        <section className="mb-6 lg:col-start-2 lg:row-start-2 lg:mb-0">
          <GoalGauge
            percent={percent}
            doneCount={done.length}
            total={total}
            yesterday={isBase ? 50 : undefined}
            caption={isBase ? "Goals reached today" : "Goals reached"}
          />
        </section>

        <section className="lg:col-start-1 lg:row-start-3 lg:mt-0">
          <div className="mb-2 flex items-end justify-between">
            <h2 className="text-[13px] font-bold tracking-tight text-ink lg:text-[16px]">
              {isBase ? "Today's journey" : "This day's journey"}
            </h2>
            <Link href="/tasks" className="text-[10px] font-semibold text-muted underline lg:text-[12px]">
              See all
            </Link>
          </div>

          {open.length === 0 && done.length === 0 ? (
            <div className="card px-4 py-5 text-center">
              <p className="text-[12px] font-semibold text-ink">Nothing planned for this day</p>
              <p className="mt-1 text-[10px] text-muted">
                Add a task to shape {isBase ? "today" : formatLong(selectedDate)}.
              </p>
              <div className="mt-3">
                <Button href="/tasks" iconLeft={<Plus className="h-4 w-4" strokeWidth={2.4} />} full={false}>
                  Add a task
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {open.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
              {done.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>

        <aside className="lg:col-start-2 lg:row-start-3 lg:mt-0 lg:space-y-4">
          {isBase ? (
            <Link
              href="/tasks/review-project-milestones"
              className="mt-5 flex items-center gap-3 rounded-2xl border border-lime-deep/50 bg-lime-pale px-3.5 py-3 lg:mt-0"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-inksoft">
                <CalendarClock className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold text-ink">Milestone review at 10:00</span>
                <span className="block text-[10px] text-muted">10:00 · Calendar · Today</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ) : null}

          <section className="mt-5 lg:mt-0">
            <p className="mb-2 text-[10px] text-muted lg:text-[12px]">
              Got something worth remembering?
            </p>
            <Button href="/onwards/new" iconLeft={<Plus className="h-4 w-4" strokeWidth={2.4} />}>
              Log an onWard
            </Button>
          </section>
        </aside>
      </div>
    </PhoneShell>
  );
}
