"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneShell } from "@/components/phone-shell";
import { BackLink, Button, Chip, Field, TextArea, TextInput, Toggle } from "@/components/ui";
import { useStore } from "@/components/store";
import { Bell, CalendarDays, Check, ChevronDown, ChevronRight, Clock, Flag, MoreHorizontal, Trash2 } from "lucide-react";

const REMINDERS = ["At time", "15 min before", "Custom"];

export default function EditTaskPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tasks, updateTask, deleteTask, toggleTask, hydrated } = useStore();
  const task = tasks.find((t) => t.id === params.id);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [time, setTime] = useState("");
  const [remind, setRemind] = useState(true);
  const [reminder, setReminder] = useState("15 min before");

  // Seed the form once the store has the task (and after hydration).
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setNotes(task.notes ?? "");
    setDueDate(task.dueDate ?? "");
    setTime(task.time ?? "");
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

  const save = () => {
    updateTask(task.id, {
      title: title.trim() || task.title,
      notes,
      dueDate,
      time: time || undefined,
    });
    router.push("/tasks");
  };

  const remove = () => {
    deleteTask(task.id);
    router.push("/tasks");
  };

  return (
    <PhoneShell>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <BackLink href="/tasks" label="Back to tasks" />
          <h1 className="text-[17px] font-bold tracking-tight text-ink">Edit task</h1>
        </div>
        <button type="button" aria-label="More options" className="text-inksoft">
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </button>
      </div>
      <p className="tiny mb-5">A clear next step makes a good day easier.</p>

      <div className="space-y-4">
        <Field label="What needs doing?">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Notes">
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date">
            <TextInput
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              trailing={<CalendarDays className="h-4 w-4" />}
            />
          </Field>
          <Field label="Time">
            <TextInput
              value={time}
              onChange={(e) => setTime(e.target.value)}
              trailing={<Clock className="h-4 w-4" />}
            />
          </Field>
        </div>

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
            <Check className="h-3 w-3 text-lime-deep" strokeWidth={3} /> Today at 09:45 · Push
            notification
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="List">
            <button type="button" className="field-input flex items-center justify-between text-left">
              {task.list}
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>
          </Field>
          <Field label="Priority">
            <button type="button" className="field-input flex items-center justify-between text-left">
              <span className="flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5 text-muted" /> {task.priority}
              </span>
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>
          </Field>
        </div>

        <button
          type="button"
          onClick={() => toggleTask(task.id)}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-paper px-3.5 py-3"
        >
          <span className="text-[12px] font-semibold text-ink">Mark as done</span>
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
      <p className="mt-4 text-center">
        <button
          type="button"
          onClick={remove}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted underline"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete task
        </button>
      </p>
    </PhoneShell>
  );
}
