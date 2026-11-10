"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EyeOff, Minus, MoreHorizontal, Pause, Play, Plus, Timer, Trash2, GripVertical } from "lucide-react";
import { useAuth } from "@/components/auth";
import { Modal } from "@/components/modal";
import { useStore } from "@/components/store";
import { toastSuccess, toastUndoable } from "@/components/toast";
import { playAlarm, primeAlarm, useAlarmTone } from "@/lib/alarm";
import { useLocalState } from "@/lib/local-state";
import { haptic } from "@/lib/haptics";
import { emitNotice } from "@/lib/notices";
import { uuid } from "@/lib/db";

/**
 * The small list you keep next to the clock: a few things you want off your head
 * today. Checking one is the same as finishing it, so it leaves the list on the
 * spot — with an Undo in case that was a slip. It lives on this device only.
 */

type Item = { id: string; text: string };

const SWIPE_DELETE = 56;
const MAX_TEXT = 120;

/** The quiet reminder that sits under the list. Kept apart from the items so the
 *  two never share a storage key, and kept as an end time so a reload does not
 *  hand the minutes back. */
type Reminder = { minutes: number; remainingSec: number; endsAt: number | null };

const REMINDER = { min: 5, max: 60, step: 5 };

const freshReminder = (): Reminder => ({ minutes: 5, remainingSec: 5 * 60, endsAt: null });

const reminderClock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export function ChecklistWidget({ onHide }: { onHide: () => void }) {
  const { user } = useAuth();
  const { settings } = useStore();
  const [items, setItems] = useLocalState<Item[]>(
    user ? `onward.checklist.v1:${user.id}` : null,
    [],
  );
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<string, number>>({});
  const [reminder, setReminder] = useLocalState<Reminder>(
    user ? `onward.checklist-timer.v1:${user.id}` : null,
    freshReminder(),
  );
  const [tone] = useAlarmTone(user ? user.id : null);
  const [now, setNow] = useState(() => Date.now());
  const settled = useRef(false);

  const running = reminder.endsAt != null;
  const remaining = running
    ? Math.max(0, Math.round(((reminder.endsAt ?? 0) - now) / 1000))
    : reminder.remainingSec;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  const ring = useCallback(() => {
    setReminder((r) => ({ ...r, endsAt: null, remainingSec: r.minutes * 60 }));
    haptic("success", settings.haptics);
    playAlarm(tone);
    toastSuccess("Checklist reminder — time to look at your list");
    emitNotice({
      kind: "win",
      title: "Checklist reminder",
      body: "The reminder you set on the checklist just rang.",
      href: "/today",
    });
  }, [setReminder, settings.haptics, tone]);

  // A reminder that reaches zero while another screen is up still rings once,
  // the moment this one paints again.
  useEffect(() => {
    if (!running || remaining > 0) return;
    if (settled.current) return;
    settled.current = true;
    ring();
  }, [ring, remaining, running]);

  useEffect(() => {
    if (!running) settled.current = false;
  }, [running]);

  function toggleReminder() {
    haptic("tap", settings.haptics);
    // The starting tap is what lets the browser play the ring at the end.
    primeAlarm();
    setReminder((r) => {
      if (r.endsAt != null) {
        return {
          ...r,
          endsAt: null,
          remainingSec: Math.max(0, Math.round((r.endsAt - Date.now()) / 1000)),
        };
      }
      const secs = r.remainingSec > 0 ? r.remainingSec : r.minutes * 60;
      return { ...r, remainingSec: secs, endsAt: Date.now() + secs * 1000 };
    });
  }

  function nudgeReminder(direction: 1 | -1) {
    setReminder((r) => {
      if (r.endsAt != null) return r;
      const minutes = Math.min(
        REMINDER.max,
        Math.max(REMINDER.min, r.minutes + direction * REMINDER.step),
      );
      return { ...r, minutes, remainingSec: minutes * 60 };
    });
  }

  const swipe = useRef<{ id: string; x: number; y: number; axis: "none" | "x" | "y" } | null>(
    null,
  );
  const reorder = useRef<{ id: string; y: number; rowH: number } | null>(null);

  function add() {
    const text = draft.trim().slice(0, MAX_TEXT);
    if (!text) return;
    setItems((prev) => [...prev, { id: uuid(), text }]);
    setDraft("");
    haptic("tap", settings.haptics);
  }

  function remove(target: Item, phrase: string) {
    const at = items.findIndex((i) => i.id === target.id);
    if (at < 0) return;
    setItems((prev) => prev.filter((i) => i.id !== target.id));
    setOffsets((prev) => ({ ...prev, [target.id]: 0 }));
    haptic("success", settings.haptics);
    toastUndoable(phrase, "Undo", () =>
      setItems((prev) =>
        prev.some((i) => i.id === target.id)
          ? prev
          : [...prev.slice(0, at), target, ...prev.slice(at)],
      ),
    );
  }

  function clearList() {
    const snapshot = items;
    if (!snapshot.length) return;
    setItems([]);
    setMenu(false);
    toastUndoable("Checklist cleared", "Undo", () => setItems(snapshot));
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
          Checking one off finishes it. Drag the grip to arrange, slide a row left to delete.
        </p>
      ) : null}

      {items.length ? (
        <ul className="wheel mt-1 max-h-[188px] divide-y divide-line overflow-y-auto">
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
                  className="relative flex touch-pan-y items-center gap-2.5 bg-paper pl-0.5 pr-1"
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
                  </span>
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

      <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3">
        <Timer className="h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={2} />
        <span className="text-[10px] font-semibold text-muted">Remind me in</span>
        <span className="min-w-0 flex-1" />
        <button
          type="button"
          aria-label="Shorten the reminder"
          disabled={running}
          onClick={() => nudgeReminder(-1)}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream disabled:cursor-default disabled:text-faint"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
        <span className="w-[42px] text-center text-[12px] font-bold leading-none text-ink tabular-nums">
          {reminderClock(remaining)}
        </span>
        <button
          type="button"
          aria-label="Lengthen the reminder"
          disabled={running}
          onClick={() => nudgeReminder(1)}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream disabled:cursor-default disabled:text-faint"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={toggleReminder}
          aria-label={
            running ? `Pause the reminder, ${reminderClock(remaining)} left` : "Start the reminder"
          }
          className="ml-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line text-ink transition hover:border-dash"
        >
          {running ? (
            <Pause className="h-3 w-3 fill-current" strokeWidth={0} />
          ) : (
            <Play className="h-3 w-3 fill-current" strokeWidth={0} />
          )}
        </button>
      </div>

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
    </section>
  );
}
