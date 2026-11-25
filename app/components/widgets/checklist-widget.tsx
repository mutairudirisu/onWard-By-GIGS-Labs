"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlarmClock,
  Check,
  EyeOff,
  MoreHorizontal,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth";
import { Modal } from "@/components/ui/modal";
import { useNotifications } from "@/components/providers/notifications";
import { useStore } from "@/components/providers/store";
import { toastError, toastUndoable } from "@/components/ui/toast";
import { playAlarm, primeAlarm, useAlarmTone } from "@/lib/alarm";
import { useLocalState } from "@/lib/local-state";
import {
  cancelPushNotification,
  registerPushSubscription,
  schedulePushNotification,
} from "@/lib/push-client";
import { haptic } from "@/lib/haptics";
import { emitNotice } from "@/lib/notices";
import { uuid } from "@/lib/db";

/**
 * The small list you keep next to the clock: a few things you want off your head
 * today. Checking one is the same as finishing it, so it leaves the list on the
 * spot — with an Undo in case that was a slip. The list is local; reminder jobs
 * are also saved to the server so push can arrive while the app is closed.
 */

type Item = { id: string; text: string; reminderAt?: string | null; backgroundPush?: boolean };

const SWIPE_DELETE = 56;
const MAX_TEXT = 120;

function localDateTimeValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function ChecklistWidget({ onHide }: { onHide: () => void }) {
  const { user } = useAuth();
  const { settings } = useStore();
  const { permission, enableAlerts, pushReady } = useNotifications();
  const [items, setItems] = useLocalState<Item[]>(
    user ? `onward.checklist.v1:${user.id}` : null,
    [],
  );
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<string, number>>({});
  const [reminderItemId, setReminderItemId] = useState<string | null>(null);
  const [reminderDraft, setReminderDraft] = useState("");
  const [reminderError, setReminderError] = useState("");

  const swipe = useRef<{ id: string; x: number; y: number; axis: "none" | "x" | "y" } | null>(
    null,
  );
  const reorder = useRef<{ id: string; y: number; rowH: number } | null>(null);

  function add() {
    const text = draft.trim().slice(0, MAX_TEXT);
    if (!text) return;
    setItems((prev) => [...prev, { id: uuid(), text, reminderAt: null }]);
    setDraft("");
    haptic("tap", settings.haptics);
  }

  function openReminder(item: Item) {
    const existing = item.reminderAt ? Date.parse(item.reminderAt) : NaN;
    const initial =
      Number.isFinite(existing) && existing > Date.now()
        ? new Date(existing)
        : new Date(Date.now() + 60 * 60 * 1000);
    setReminderDraft(localDateTimeValue(initial));
    setReminderError("");
    setReminderItemId(item.id);
  }

  function closeReminder() {
    setReminderItemId(null);
    setReminderError("");
  }

  async function saveReminder() {
    const at = new Date(reminderDraft).getTime();
    if (!Number.isFinite(at) || at <= Date.now()) {
      setReminderError("Choose a date and time in the future.");
      return;
    }
    if (!reminderItemId) return;
    const item = items.find((entry) => entry.id === reminderItemId);
    if (!item) return;
    const scheduledAt = new Date(at).toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === reminderItemId
          ? { ...item, reminderAt: scheduledAt, backgroundPush: false }
          : item,
      ),
    );
    try {
      if (!settings.notifications) {
        throw new Error("Turn on Push notifications in Settings to get this when the app is closed.");
      }
      if (permission !== "granted" && (await enableAlerts()) !== "granted") {
        throw new Error("Allow notifications in your browser to get this when the app is closed.");
      }
      if (!pushReady) await registerPushSubscription();
      await schedulePushNotification({
        kind: "checklist",
        eventId: item.id,
        scheduledAt,
        title: "Task reminder",
        body: item.text,
        href: "/today",
      });
      setItems((prev) =>
        prev.map((current) =>
          current.id === item.id && current.reminderAt === scheduledAt
            ? { ...current, backgroundPush: true }
            : current,
        ),
      );
    } catch (error) {
      console.error("Could not schedule background checklist reminder", error);
    }
    primeAlarm();
    haptic("tap", settings.haptics);
    closeReminder();
  }

  function removeReminder() {
    if (!reminderItemId) return;
    const item = items.find((entry) => entry.id === reminderItemId);
    if (item?.backgroundPush) {
      void cancelPushNotification("checklist", reminderItemId).catch((error: unknown) =>
        toastError(error instanceof Error ? error.message : "Could not cancel the background reminder."),
      );
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === reminderItemId ? { ...item, reminderAt: null, backgroundPush: false } : item,
      ),
    );
    closeReminder();
  }

  function remove(target: Item, phrase: string) {
    const at = items.findIndex((i) => i.id === target.id);
    if (at < 0) return;
    if (target.reminderAt && target.backgroundPush) {
      void cancelPushNotification("checklist", target.id).catch((error: unknown) =>
        toastError(error instanceof Error ? error.message : "Could not cancel the background reminder."),
      );
    }
    setItems((prev) => prev.filter((i) => i.id !== target.id));
    setOffsets((prev) => ({ ...prev, [target.id]: 0 }));
    haptic("success", settings.haptics);
    toastUndoable(phrase, "Undo", () => {
      setItems((prev) =>
        prev.some((i) => i.id === target.id)
          ? prev
          : [...prev.slice(0, at), target, ...prev.slice(at)],
      );
      if (target.reminderAt && target.backgroundPush && Date.parse(target.reminderAt) > Date.now()) {
        void schedulePushNotification({
          kind: "checklist",
          eventId: target.id,
          scheduledAt: target.reminderAt,
          title: "Task reminder",
          body: target.text,
          href: "/today",
        }).catch((error: unknown) =>
          toastError(error instanceof Error ? error.message : "Could not restore the background reminder."),
        );
      }
    });
  }

  function clearList() {
    const snapshot = items;
    if (!snapshot.length) return;
    snapshot
      .filter((item) => item.reminderAt)
      .forEach((item) => {
        if (item.backgroundPush) {
          void cancelPushNotification("checklist", item.id).catch((error: unknown) =>
            toastError(error instanceof Error ? error.message : "Could not cancel a background reminder."),
          );
        }
      });
    setItems([]);
    setMenu(false);
    toastUndoable("Checklist cleared", "Undo", () => {
      setItems(snapshot);
      snapshot
        .filter(
          (item) =>
            item.reminderAt &&
            item.backgroundPush &&
            Date.parse(item.reminderAt) > Date.now(),
        )
        .forEach((item) => {
          void schedulePushNotification({
            kind: "checklist",
            eventId: item.id,
            scheduledAt: item.reminderAt!,
            title: "Task reminder",
            body: item.text,
            href: "/today",
          }).catch((error: unknown) =>
            toastError(error instanceof Error ? error.message : "Could not restore a background reminder."),
          );
        });
    });
  }

  /** Slide a row left far enough and it goes, the way the swipe lists behaved. */
  function rowProps(item: Item) {
    return {
      onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        swipe.current = { id: item.id, x: event.clientX, y: event.clientY, axis: "none" };
      },
      onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
        const d = swipe.current;
        if (!d || d.id !== item.id) return;
        const dx = event.clientX - d.x;
        const dy = event.clientY - d.y;
        if (d.axis === "none") {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
          if (d.axis === "x") event.currentTarget.setPointerCapture?.(event.pointerId);
        }
        if (d.axis !== "x") return;
        event.preventDefault();
        setOffsets((prev) => ({ ...prev, [item.id]: Math.max(-88, Math.min(0, dx)) }));
      },
      onPointerUp: () => {
        const d = swipe.current;
        swipe.current = null;
        if (!d || d.axis !== "x") return;
        const offset = offsets[d.id] ?? 0;
        const target = items.find((i) => i.id === d.id);
        if (offset <= -SWIPE_DELETE && target) {
          remove(target, "Removed from the checklist");
          return;
        }
        setOffsets((prev) => ({ ...prev, [d.id]: 0 }));
      },
      onPointerCancel: () => {
        const d = swipe.current;
        swipe.current = null;
        if (d) setOffsets((prev) => ({ ...prev, [d.id]: 0 }));
      },
    };
  }

  /** The grip lifts a row and walks it up or down the list while you drag. */
  function gripProps(item: Item) {
    return {
      onPointerDown: (event: React.PointerEvent<HTMLSpanElement>) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const row = event.currentTarget.closest("li");
        reorder.current = {
          id: item.id,
          y: event.clientY,
          rowH: row?.offsetHeight || 44,
        };
        setDragId(item.id);
        event.currentTarget.setPointerCapture?.(event.pointerId);
        haptic("tap", settings.haptics);
      },
      onPointerMove: (event: React.PointerEvent<HTMLSpanElement>) => {
        const d = reorder.current;
        if (!d) return;
        event.preventDefault();
        const steps = Math.round((event.clientY - d.y) / d.rowH);
        if (steps === 0) return;
        setItems((prev) => {
          const from = prev.findIndex((i) => i.id === d.id);
          if (from < 0) return prev;
          const to = Math.min(prev.length - 1, Math.max(0, from + steps));
          if (to === from) return prev;
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return next;
        });
        d.y += steps * d.rowH;
      },
      onPointerUp: () => {
        reorder.current = null;
        setDragId(null);
      },
      onPointerCancel: () => {
        reorder.current = null;
        setDragId(null);
      },
    };
  }

  return (
    <section className="card relative px-4 py-4" aria-label="Checklist">
      <div className="flex items-center gap-2">
        <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
          Checklist
        </h3>
        <button
          type="button"
          aria-label="Add an item"
          aria-expanded={adding}
          onClick={() => {
            setAdding((open) => !open);
            haptic("tap", settings.haptics);
          }}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-lime text-dark transition hover:bg-lime-deep"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.8} />
        </button>
        <span className="min-w-0 flex-1" />
        <button
          type="button"
          aria-label="Checklist options"
          aria-haspopup="dialog"
          onClick={() => setMenu(true)}
          className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
          <MoreHorizontal className="h-[17px] w-[17px]" />
        </button>
      </div>

      {adding ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-dash bg-paper py-1.5 pl-2.5 pr-1.5">
          <input
            value={draft}
            autoFocus
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_TEXT))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
              if (event.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            placeholder="Add an item"
            aria-label="New checklist item"
            className="min-w-0 flex-1 bg-transparent text-[12px] font-medium text-ink outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.trim()}
            aria-label="Add to the checklist"
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
              draft.trim()
                ? "cursor-pointer bg-lime text-dark hover:bg-lime-deep"
                : "cursor-not-allowed bg-line text-muted"
            }`}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.8} />
          </button>
        </div>
      ) : null}

      {items.length ? (
        <p className="mt-2.5 text-[10.5px] leading-[1.5] text-muted">
          Tap the clock to set a reminder. Drag the grip to arrange, or slide left to delete.
        </p>
      ) : null}

      {items.length ? (
        <ul className="wheel mt-1 max-h-[188px] space-y-1 overflow-y-auto">
          {items.map((item) => {
            const offset = offsets[item.id] ?? 0;
            return (
              <li key={item.id} className="relative">
                <span
                  aria-hidden
                  className="absolute inset-y-0 right-1 flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.08em] text-danger"
                  style={{ opacity: offset < -12 ? 1 : 0 }}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Delete
                </span>
                <div
                  className="relative flex touch-pan-y items-center gap-2.5 rounded-xl bg-lime-pale px-2"
                  style={{
                    transform: `translateX(${offset}px)`,
                    transition: swipe.current?.id === item.id ? "none" : "transform 0.18s ease-out",
                  }}
                  {...rowProps(item)}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={false}
                    aria-label={`Finish "${item.text}"`}
                    onClick={() => remove(item, "Cleared off the checklist")}
                    className="flex h-[19px] w-[19px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] border-[1.8px] border-line transition hover:border-lime-deep"
                  />
                  <span className="min-w-0 flex-1 py-2.5 text-[12px] leading-[1.45] text-ink [overflow-wrap:anywhere]">
                    {item.text}
                    {item.reminderAt ? (
                      <span className="mt-0.5 block text-[9.5px] font-medium text-muted">
                        {new Date(item.reminderAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : null}
                  </span>
                  <button
                  type="button"
                  aria-label={
                    item.reminderAt
                      ? `Change reminder for "${item.text}"`
                      : `Set reminder for "${item.text}"`
                  }
                  aria-haspopup="dialog"
                  onClick={() => openReminder(item)}
                  className={`flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition hover:bg-lime-soft ${
                    item.reminderAt ? "text-lime-deep" : "text-muted"
                  }`}
                  >
                  <AlarmClock className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <span
                    role="button"
                    aria-label={`Drag to arrange "${item.text}"`}
                    tabIndex={0}
                    {...gripProps(item)}
                    className={`-mr-1 shrink-0 cursor-grab touch-none p-1 text-faint transition active:cursor-grabbing ${
                      dragId === item.id ? "text-ink" : ""
                    }`}
                  >
                    <GripVertical className="h-4 w-4" strokeWidth={2} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : adding ? null : (
        <p className="mt-2.5 text-[11px] leading-[1.6] text-muted">
          Nothing on it. One thing you can finish today is enough.
        </p>
      )}

      <Modal open={menu} onClose={() => setMenu(false)} title="Checklist">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={clearList}
            disabled={!items.length}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-[12.5px] font-semibold text-ink transition hover:bg-cream disabled:cursor-default disabled:text-faint"
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            Clear the whole list
          </button>
          <button
            type="button"
            onClick={() => {
              setMenu(false);
              onHide();
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-[12.5px] font-semibold text-ink transition hover:bg-cream"
          >
            <EyeOff className="h-4 w-4 shrink-0 text-inksoft" strokeWidth={2} />
            Hide this widget
          </button>
        </div>
        <p className="mt-2 px-3 text-[11px] leading-[1.6] text-muted">
          Checking an item finishes it and takes it off. Drag the grip to arrange, or slide a
          row left to delete it.
        </p>
      </Modal>

      <Modal open={reminderItemId !== null} onClose={closeReminder} title="Set a reminder">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void saveReminder();
          }}
        >
          <label className="block">
            <span className="label">Date and time</span>
            <input
              type="datetime-local"
              value={reminderDraft}
              min={localDateTimeValue(new Date())}
              onChange={(event) => {
                setReminderDraft(event.target.value);
                setReminderError("");
              }}
              required
              className="field-input"
            />
          </label>
          <p className="mt-2 text-[10.5px] leading-[1.5] text-muted">
            With notifications enabled, this reminder can reach your device while onWard is closed.
            Otherwise, it will appear the next time the app is open.
          </p>
          {reminderError ? (
            <p role="alert" className="mt-3 text-[11px] font-semibold text-danger">
              {reminderError}
            </p>
          ) : null}
          <div className="mt-5 flex gap-2.5">
            {items.find((item) => item.id === reminderItemId)?.reminderAt ? (
              <button
                type="button"
                onClick={removeReminder}
                className="flex-1 cursor-pointer rounded-btn border border-line bg-paper px-3 py-3 text-[12px] font-semibold text-inksoft transition hover:bg-cream"
              >
                Remove
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeReminder}
              className="flex-1 cursor-pointer rounded-btn border border-line bg-paper px-3 py-3 text-[12px] font-semibold text-inksoft transition hover:bg-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 cursor-pointer rounded-btn bg-lime px-3 py-3 text-[12px] font-bold text-dark transition hover:bg-lime-deep"
            >
              Set reminder
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

/** Keep scheduled checklist reminders active while the user moves around the app. */
export function ChecklistReminderScheduler() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useStore();
  const [items, setItems, itemsLoaded] = useLocalState<Item[]>(
    user ? `onward.checklist.v1:${user.id}` : null,
    [],
  );
  const [tone] = useAlarmTone(user ? user.id : null);
  const [now, setNow] = useState(() => Date.now());
  const [dueReminders, setDueReminders] = useState<Item[]>([]);
  const handledReminders = useRef(new Set<string>());
  const hasReminders = items.some((item) => Boolean(item.reminderAt));

  useEffect(() => {
    if (!hasReminders) return;
    setNow(Date.now());
    const update = () => setNow(Date.now());
    const id = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", update);
    };
  }, [hasReminders]);

  useEffect(() => {
    if (!itemsLoaded) return;
    const due = items.filter(
      (item) => item.reminderAt && Date.parse(item.reminderAt) <= now,
    );
    const freshDue = due.filter((item) => {
      const key = `${item.id}:${item.reminderAt}`;
      if (handledReminders.current.has(key)) return false;
      handledReminders.current.add(key);
      return true;
    });
    if (!freshDue.length) return;

    const dueKeys = new Set(freshDue.map((item) => `${item.id}:${item.reminderAt}`));
    setItems((prev) =>
      prev.map((item) =>
        item.reminderAt && dueKeys.has(`${item.id}:${item.reminderAt}`)
          ? { ...item, reminderAt: null, backgroundPush: false }
          : item,
      ),
    );
    for (const item of freshDue) {
      if (item.backgroundPush) {
        void cancelPushNotification("checklist", item.id).catch((error: unknown) =>
          console.error("Could not clear delivered checklist push schedule", error),
        );
      }
    }
    haptic("success", settings.haptics);
    playAlarm(tone);
    setDueReminders(freshDue);
    for (const item of freshDue) {
      emitNotice({
        id: `checklist:${user?.id}:${item.id}`,
        kind: "win",
        title: "Task reminder",
        body: item.text,
        href: "/today",
      });
    }
  }, [items, itemsLoaded, now, setItems, settings.haptics, tone, user?.id]);

  return (
    <Modal
      open={dueReminders.length > 0}
      onClose={() => setDueReminders([])}
      title={dueReminders.length === 1 ? "Checklist reminder" : "Checklist reminders"}
    >
      <div className="flex flex-col items-center px-2 pb-1 pt-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-pale text-lime-deep">
          <Check className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <p className="mt-4 text-[14px] font-semibold text-ink">
          {dueReminders.length === 1 ? "A checklist item is due." : "Your checklist reminders are due."}
        </p>
        <div className="mt-2 max-h-36 w-full overflow-y-auto rounded-xl bg-cream px-3 py-2 text-left">
          {dueReminders.map((item) => (
            <p key={item.id} className="py-1 text-[12px] leading-[1.5] text-ink [overflow-wrap:anywhere]">
              {item.text}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setDueReminders([]);
            router.push("/today");
          }}
          className="mt-5 min-h-10 w-full cursor-pointer rounded-full bg-lime px-5 text-[12px] font-bold text-dark transition hover:bg-lime-deep"
        >
          Open checklist
        </button>
        <button
          type="button"
          onClick={() => setDueReminders([])}
          className="mt-2 min-h-10 w-full cursor-pointer rounded-full border border-line bg-paper px-5 text-[12px] font-bold text-ink transition hover:bg-cream"
        >
          Close reminder
        </button>
      </div>
    </Modal>
  );
}
