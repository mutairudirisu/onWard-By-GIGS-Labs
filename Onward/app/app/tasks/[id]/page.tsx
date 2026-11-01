"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { Modal } from "@/components/modal";
import { ReminderModal } from "@/components/reminder-modal";
import { BackLink, Button, Chip, Field, TextInput, Toggle } from "@/components/ui";
import { useStore } from "@/components/store";
import { BASE_DATE } from "@/lib/data";
import { formatClock, formatMedium, formatTasksHeader } from "@/lib/dates";
import {
  Bell,
  CalendarDays,
  Check,
  Clock,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";

const REMINDERS = ["At time", "15 min before", "Custom"];

export default function EditTaskPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tasks, settings, updateTask, deleteTask, toggleTask, hydrated } = useStore();
  const task = tasks.find((t) => t.id === params.id);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(BASE_DATE);
  const [time, setTime] = useState("");
  const [remind, setRemind] = useState(true);
  const [reminder, setReminder] = useState("15 min before");
  const [whenOpen, setWhenOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Seed the form once the store has the task (and after hydration).
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDate(task.date ?? BASE_DATE);
    setTime(task.time ?? "");
    setRemind(Boolean(task.time));
  }, [task?.id, hydrated]);

  if (!task) {
    return (
      <PhoneShell>
        <div className="mb-4 flex items-center gap-1">
          <BackLink href="/tasks" label="Back to tasks" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Edit task</h1>
        </div>
        <p className="card px-4 py-6 text-center text-[12px] text-muted">
          This task no longer exists.
        </p>
        <div className="mt-4">
          <Button href="/tasks">Back to tasks</Button>
        </div>
      </PhoneShell>
    );
  }

  const whenLabel = time ? `${formatMedium(date)} · ${formatClock(time)}` : formatMedium(date);

  const save = () => {
    updateTask(task.id, {
      title: title.trim() || task.title,
      date,
      dueDate: formatMedium(date),
      time: time || undefined,
    });
    router.push("/tasks");
  };

  const remove = () => {
    setMenuOpen(false);
    deleteTask(task.id);
    router.push("/tasks");
  };

  const share = async () => {
    setMenuOpen(false);
    const text = `${title.trim() || task.title} — ${whenLabel}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        /* dismissed — fall through to the clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <PhoneShell>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BackLink href="/tasks" label="Back to tasks" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Edit task</h1>
          {copied ? (
            <span className="ml-1 flex items-center gap-1 text-[9px] font-semibold text-lime-deep">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
              Copied
            </span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Task options"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </button>
      </div>
      <p className="tiny mb-5">A clear next step makes a good day easier.</p>

      <div className="space-y-4">
        <Field label="What needs doing?">
          <TextInput id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Due">
          <button
            type="button"
            onClick={() => setWhenOpen(true)}
            className="field-input flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <CalendarDays className="h-4 w-4 text-muted" />
              {whenLabel}
            </span>
            <Clock className="h-4 w-4 text-muted" />
          </button>
        </Field>

        <div className="card px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-soft text-inksoft">
              <Bell className="h-4 w-4" />
            </span>
            <span className="flex-1 text-[12px] font-bold text-ink">Remind me</span>
            <Toggle checked={remind} onChange={setRemind} label="Remind me" />
          </div>
          <div className="mt-3 flex gap-2">
            {REMINDERS.map((r) => (
              <Chip
                key={r}
                active={reminder === r}
                onClick={() => setReminder(r)}
                className={reminder === r ? "bg-cream" : ""}
              >
                {r}
              </Chip>
            ))}
          </div>
          <p className="mt-2.5 flex items-center gap-1 text-[10px] font-medium text-inksoft">
            <Check className="h-3 w-3 text-lime-deep" strokeWidth={3} />{" "}
            {time ? `${formatTasksHeader(date)} at ${formatClock(time)}` : formatTasksHeader(date)}{" "}
            · Push notification
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleTask(task.id)}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-paper px-3.5 py-3"
        >
          <span className="text-[12px] font-semibold text-ink">
            {task.done ? "Mark as not done" : "Mark as done"}
          </span>
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
              task.done ? "border-lime-deep bg-lime" : "border-dash bg-paper"
            }`}
          >
            {task.done ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
          </span>
        </button>
      </div>

      <div className="mt-6">
        <Button onClick={save} iconLeft={<Check className="h-4 w-4" strokeWidth={2.4} />}>
          Save changes
        </Button>
      </div>

      <ReminderModal
        open={whenOpen}
        onClose={() => setWhenOpen(false)}
        onSave={(value) => {
          setDate(value.date);
          setTime(value.time);
          setWhenOpen(false);
        }}
        initial={{ date, time: time || settings.defaultReminderTime }}
        defaultDate={date}
        defaultTime={settings.defaultReminderTime}
      />

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Task options">
        <div className="-mx-1 flex flex-col">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              const el = document.getElementById("task-title") as HTMLInputElement | null;
              el?.focus();
              el?.select();
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <Pencil className="h-[18px] w-[18px] text-inksoft" />
            <span className="text-[13px] font-semibold text-ink">Edit title</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              toggleTask(task.id);
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-dash">
              {task.done ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
            </span>
            <span className="text-[13px] font-semibold text-ink">
              {task.done ? "Mark as not done" : "Mark as done"}
            </span>
          </button>
          <button
            type="button"
            onClick={share}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <Share2 className="h-[18px] w-[18px] text-inksoft" />
            <span className="text-[13px] font-semibold text-ink">Share task</span>
          </button>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            onClick={remove}
            className="flex items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-cream"
          >
            <Trash2 className="h-[18px] w-[18px] text-[#E5484D]" />
            <span className="text-[13px] font-semibold text-[#E5484D]">Delete task</span>
          </button>
        </div>
      </Modal>
    </PhoneShell>
  );
}
