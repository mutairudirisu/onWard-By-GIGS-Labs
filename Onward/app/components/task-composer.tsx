"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Bell, Check, Clock, X } from "lucide-react";
import { DictateButton } from "@/components/dictate-button";
import { useStore } from "@/components/store";
import { ReminderModal, type ReminderValue } from "@/components/reminder-modal";
import { UpgradeModal } from "@/components/pro";
import { BASE_DATE, type Task } from "@/lib/data";
import { formatMedium, formatTasksHeader } from "@/lib/dates";
import { noteToBody, parseNote, type NoteLine } from "@/lib/checklist";
import { appendDictation } from "@/lib/dictation";
import { useKeyboardInset } from "@/lib/keyboard";

/** One line of the composer: the task itself, or one of its subtasks. */
type Row = { done: boolean; text: string };

type ComposerApi = { open: (taskId?: string) => void };

const TaskComposerContext = createContext<ComposerApi | null>(null);

export function useTaskComposer() {
  const ctx = useContext(TaskComposerContext);
  if (!ctx) throw new Error("useTaskComposer needs a TaskComposerProvider");
  return ctx;
}

const blank = (): Row => ({ done: false, text: "" });

function rowsOf(task?: Task): Row[] {
  if (!task) return [blank()];
  const steps = parseNote(task.steps ?? "")
    .filter(
      (line): line is Extract<NoteLine, { kind: "item" }> =>
        line.kind === "item" && Boolean(line.text.trim()),
    )
    .map((line) => ({ done: line.done, text: line.text }));
  return [{ done: task.done, text: task.title }, ...steps];
}

function toItem(row: Row): NoteLine {
  return { kind: "item", done: row.done, text: row.text.trim() };
}

function format12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${ap}`;
}

export function TaskComposerProvider({ children }: { children: ReactNode }) {
  const { tasks, selectedDate, settings, addTask, updateTask, limits, remindersUsed, remindersFull } =
    useStore();
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const [taskId, setTaskId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [reminder, setReminder] = useState<ReminderValue | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  // Which row the keyboard should land on once the sheet has painted.
  const [pendingFocus, setPendingFocus] = useState<number | null>(0);
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const lastRow = useRef(0);
  const keyboardInset = useKeyboardInset();

  const open = useCallback((id?: string) => {
    const task = id ? tasksRef.current.find((t) => t.id === id) : undefined;
    setTaskId(task?.id ?? null);
    setRows(rowsOf(task));
    setReminder(task?.time ? { date: task.date ?? BASE_DATE, time: task.time } : null);
    setPendingFocus(0);
    setSheetOpen(true);
  }, []);

  const api = useMemo(() => ({ open }), [open]);

  const close = useCallback(() => {
    setSheetOpen(false);
    setTaskId(null);
  }, []);

  // The page behind holds still, and Escape is the same as tapping the scrim.
  useLayoutEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen, close]);

  // Every row is one line tall until its own text says otherwise.
  useLayoutEffect(() => {
    if (!sheetOpen) return;
    refs.current.forEach((el) => {
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    });
    if (pendingFocus === null) return;
    const el = refs.current[pendingFocus];
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
    setPendingFocus(null);
  }, [sheetOpen, rows, pendingFocus]);

  const write = (index: number, text: string) => {
    setRows((value) => value.map((row, i) => (i === index ? { ...row, text } : row)));
  };

  // Enter drops the next line straight below the one being typed.
  const split = (index: number) => {
    setRows((value) => [...value.slice(0, index + 1), blank(), ...value.slice(index + 1)]);
    setPendingFocus(index + 1);
  };

  const drop = (index: number) => {
    setRows((value) => value.filter((_, i) => i !== index));
    setPendingFocus(Math.max(0, index - 1));
  };

  const finish = () => {
    const head = rows[0].text.trim();
    const tail = rows.slice(1).filter((row) => row.text.trim());
    // A title left blank while the lines below were filled: the first of them
    // is the task, and the rest are its subtasks.
    const titled = head
      ? { title: head, steps: tail }
      : tail.length
        ? { title: tail[0].text.trim(), steps: tail.slice(1) }
        : null;
    if (!titled) {
      close();
      return;
    }
    const steps = titled.steps.length ? noteToBody(titled.steps.map(toItem)) : "";
    const when = reminder
      ? {
          date: reminder.date,
          time: reminder.time,
          dueDate: formatMedium(reminder.date),
        }
      : { time: undefined };

    if (taskId) {
      updateTask(taskId, {
        title: titled.title,
        steps,
        ...when,
        done: titled.steps.length ? titled.steps.every((row) => row.done) : rows[0].done,
      });
    } else {
      addTask({
        title: titled.title,
        steps: steps || undefined,
        ...when,
        dueDate: reminder ? formatMedium(reminder.date) : undefined,
        date: reminder?.date,
      });
    }
    close();
  };

  const openReminder = () => {
    if (reminder || !remindersFull) setReminderOpen(true);
    else setGateOpen(true);
  };

  const editing = taskId ? tasks.find((t) => t.id === taskId) : undefined;
  const hasText = rows.some((row) => row.text.trim());

  return (
    <TaskComposerContext.Provider value={api}>
      {children}

      {sheetOpen ? (
        <>
          <div
            className="fixed inset-0 z-[65] bg-ink/45 backdrop-blur-[1px]"
            style={{ animation: "onward-fade 0.15s ease-out" }}
            onClick={close}
          />
          {/* Sits on the keyboard rather than behind it. */}
          <div
            className="fixed inset-x-0 z-[70] mx-auto w-full max-w-[400px] px-3 pb-3 md:max-w-[680px]"
            style={{ bottom: keyboardInset }}
          >
            <div
              className="rounded-3xl bg-paper px-4 pb-3 pt-3 shadow-lift"
              style={{ animation: "onward-sheet 0.22s ease-out" }}
            >
              <div className="max-h-[46vh] overflow-y-auto overflow-x-hidden">
                {rows.map((row, index) => (
                  <div key={index} className="flex items-start gap-3 py-1.5">
                    {index === 0 && rows.length > 1 ? (
                      <span aria-hidden className="mt-1 h-[22px] w-[22px] shrink-0" />
                    ) : index === 0 ? (
                      <span
                        aria-hidden
                        className={`mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 ${
                          row.done ? "border-lime-deep bg-lime" : "border-dash bg-paper"
                        }`}
                        onClick={() =>
                          editing &&
                          setRows((value) =>
                            value.map((r, i) => (i === 0 ? { ...r, done: !r.done } : r)),
                          )
                        }
                      >
                        {row.done ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
                      </span>
                    ) : (
                      <button
                        type="button"
                        aria-label={row.text.trim() ? `Mark "${row.text}" done` : "Mark this subtask done"}
                        aria-pressed={row.done}
                        onClick={() =>
                          setRows((value) =>
                            value.map((r, i) => (i === index ? { ...r, done: !r.done } : r)),
                          )
                        }
                        className={`mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 transition ${
                          row.done
                            ? "border-lime-deep bg-lime"
                            : "border-dash bg-paper hover:border-lime-deep"
                        }`}
                      >
                        {row.done ? <Check className="h-3 w-3 text-dark" strokeWidth={3} /> : null}
                      </button>
                    )}
                    <textarea
                      ref={(el) => {
                        refs.current[index] = el;
                      }}
                      rows={1}
                      value={row.text}
                      enterKeyHint="enter"
                      autoComplete="off"
                      aria-label={index === 0 ? "Task" : `Subtask ${index}`}
                      placeholder={index === 0 ? 'Tap "Enter" to create subtasks' : "Add a subtask"}
                      onFocus={() => {
                        lastRow.current = index;
                      }}
                      onChange={(e) => write(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          split(index);
                          return;
                        }
                        const el = e.currentTarget;
                        if (
                          e.key === "Backspace" &&
                          index > 0 &&
                          !row.text &&
                          el.selectionStart === 0
                        ) {
                          e.preventDefault();
                          drop(index);
                        }
                      }}
                      className={`min-w-0 flex-1 resize-none overflow-hidden bg-transparent pt-0.5 text-[15px] leading-[1.5] [overflow-wrap:anywhere] outline-none placeholder:text-faint ${
                        row.done && index > 0 ? "text-faint line-through" : "text-ink"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 border-t border-line/70 pt-2.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  {reminder ? (
                    <span className="flex min-w-0 items-center gap-1 rounded-full bg-lime-soft py-1.5 pl-3 pr-1.5 text-[11px] font-semibold text-ink">
                      <Bell className="h-3.5 w-3.5 shrink-0 text-lime-deep" strokeWidth={2.4} />
                      <button
                        type="button"
                        onClick={() => setReminderOpen(true)}
                        className="flex min-w-0 items-center gap-1"
                      >
                        <span className="truncate">{formatTasksHeader(reminder.date)}</span>
                        <span className="text-lime-deep">·</span>
                        <Clock className="h-3 w-3 shrink-0" strokeWidth={2.4} />
                        <span>{format12(reminder.time)}</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Clear reminder"
                        onClick={() => setReminder(null)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition hover:bg-lime"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={openReminder}
                      className="flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5 text-[11.5px] font-semibold text-inksoft transition hover:bg-line"
                    >
                      <Clock className="h-3.5 w-3.5" strokeWidth={2.2} /> Set reminder
                      {limits.reminderTasks != null ? (
                        <span className="text-[10px] font-semibold text-faint">
                          {Math.max(0, limits.reminderTasks - remindersUsed)} left
                        </span>
                      ) : null}
                    </button>
                  )}

                  <DictateButton
                    label="Dictate a task"
                    onText={(text) =>
                      setRows((value) =>
                        value.map((row, i) =>
                          i === lastRow.current ? { ...row, text: appendDictation(row.text, text) } : row,
                        ),
                      )
                    }
                  />
                </div>

                <button
                  type="button"
                  onClick={finish}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-bold transition active:scale-[0.98] ${
                    hasText ? "text-lime-deep hover:bg-lime-soft" : "text-muted hover:bg-cream"
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          </div>

          <ReminderModal
            open={reminderOpen}
            onClose={() => setReminderOpen(false)}
            onSave={(value) => {
              setReminder(value);
              setReminderOpen(false);
            }}
            initial={reminder}
            defaultDate={editing?.date ?? selectedDate}
            defaultTime={settings.defaultReminderTime}
          />

          <UpgradeModal
            open={gateOpen}
            onClose={() => setGateOpen(false)}
            feature="Reminders"
            title={`You've used all ${limits.reminderTasks ?? 3} free reminders`}
            blurb={`Free includes ${limits.reminderTasks ?? 3} reminders across tasks and notes. Go Pro to put a nudge on everything.`}
          />
        </>
      ) : null}
    </TaskComposerContext.Provider>
  );
}
