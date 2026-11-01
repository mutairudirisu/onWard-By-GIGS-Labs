"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { ChecklistEditor } from "@/components/checklist-editor";
import { Modal } from "@/components/modal";
import { ReminderModal } from "@/components/reminder-modal";
import { BackLink, Button, Field, TextInput, Toggle } from "@/components/ui";
import { useStore } from "@/components/store";
import { BASE_DATE } from "@/lib/data";
import { formatClock, formatMedium, formatTasksHeader } from "@/lib/dates";
import { noteToBody, parseNote, progress } from "@/lib/checklist";
import type { NoteLine } from "@/lib/checklist";
import {
  Bell,
  CalendarDays,
  Check,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";

/** Empty notes read back as one blank text line, which is not a step. */
function seedSteps(source?: string): NoteLine[] {
  return source?.trim() ? parseNote(source) : [];
}

export default function EditTaskPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tasks, settings, updateTask, deleteTask, toggleTask, setSelectedDate, hydrated } =
    useStore();
  const task = tasks.find((t) => t.id === params.id);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(BASE_DATE);
  const [time, setTime] = useState("");
  const [steps, setSteps] = useState<NoteLine[]>([]);
  const [whenOpen, setWhenOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Seed the form once the store has the task (and after hydration).
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDate(task.date ?? BASE_DATE);
    setTime(task.time ?? "");
    setSteps(seedSteps(task.steps));
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
  const stepSource = noteToBody(steps);
  const stepCount = progress(stepSource);

  const save = () => {
    updateTask(task.id, {
      title: title.trim() || task.title,
      date,
      dueDate: formatMedium(date),
      time: time || undefined,
      steps: stepSource,
    });
    // The list opens on the day the task was moved to, so it is still there.
    setSelectedDate(date);
    router.push("/tasks");
  };

  // A reminder is the task's time: switching on picks one, switching off drops it.
  const setReminder = (on: boolean) => {
    if (!on) {
      setTime("");
      return;
    }
    if (!time) setTime(settings.defaultReminderTime);
    setWhenOpen(true);
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
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[12px] font-bold text-ink">Steps</span>
            {stepCount ? (
              <span className="text-[10px] font-semibold text-muted">
                {stepCount.done} of {stepCount.total} done
              </span>
            ) : null}
          </div>
          {steps.length ? (
            <ChecklistEditor lines={steps} onChange={setSteps} placeholder="A small next move…" />
          ) : (
            <p className="py-1 text-[11px] leading-[1.55] text-muted">
              Break the task into steps. Tick the last one and the task completes itself.
            </p>
          )}
          <button
            type="button"
            onClick={() => setSteps([...steps, { kind: "item", done: false, text: "" }])}
            className="mt-1.5 flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-inksoft transition hover:bg-line"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.4} /> Add a step
          </button>
        </div>

        <div className="card px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-soft text-inksoft">
              <Bell className="h-4 w-4" />
            </span>
            <span className="flex-1 text-[12px] font-bold text-ink">Remind me</span>
            <Toggle checked={Boolean(time)} onChange={setReminder} label="Remind me" />
          </div>
          {time ? (
            <button
              type="button"
              onClick={() => setWhenOpen(true)}
              className="mt-3 flex w-full items-center justify-between rounded-xl bg-cream px-3 py-2.5 text-left transition hover:bg-line"
            >
              <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                <Clock className="h-3.5 w-3.5 text-lime-deep" strokeWidth={2.4} />
                {formatTasksHeader(date)} at {formatClock(time)}
              </span>
              <span className="text-[10px] font-semibold text-muted">Change</span>
            </button>
          ) : (
            <p className="mt-2.5 text-[10px] font-medium text-inksoft">
              Switch on to pick when the nudge arrives.
            </p>
          )}
          <p className="mt-2.5 flex items-center gap-1 text-[10px] font-medium text-muted">
            <Check className="h-3 w-3 text-lime-deep" strokeWidth={3} />{" "}
            {time ? "Alerts fire while onWard is open" : "No alert for this task"}
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
