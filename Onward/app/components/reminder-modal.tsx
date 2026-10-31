"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/modal";
import { monthGrid, monthTitle, parseISO, toISO } from "@/lib/dates";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type ReminderValue = { date: string; time: string };

const pad = (n: number) => String(n).padStart(2, "0");
const WD = ["M", "T", "W", "T", "F", "S", "S"];

function firstOfMonth(iso: string) {
  const d = parseISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
}
function shiftMonth(iso: string, delta: number) {
  const d = parseISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth() + delta, 1));
}

function splitTime(t: string) {
  const [h, m] = (t || "09:00").split(":").map(Number);
  const ap = (h ?? 9) >= 12 ? "PM" : "AM";
  let h12 = (h ?? 9) % 12;
  if (h12 === 0) h12 = 12;
  return { h12, m: m ?? 0, ap };
}
function joinTime(h12: number, m: number, ap: string) {
  let h = h12 % 12;
  if (ap === "PM") h += 12;
  return `${pad(h)}:${pad(m)}`;
}

function Wheel({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[data-active="true"]');
    if (active) el.scrollTop = active.offsetTop - el.clientHeight / 2 + active.clientHeight / 2;
  }, [value]);
  return (
    <div
      ref={ref}
      className="wheel h-[184px] flex-1 overflow-y-auto rounded-xl border border-line bg-cream"
    >
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            data-active={on}
            onClick={() => onChange(o)}
            className={`block h-[46px] w-full text-center text-[16px] font-bold leading-[46px] transition ${
              on ? "bg-lime-soft text-ink" : "text-faint hover:text-inksoft"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function ReminderModal({
  open,
  onClose,
  onSave,
  initial,
  defaultDate,
  defaultTime = "09:00",
}: {
  open: boolean;
  onClose: () => void;
  onSave: (value: ReminderValue) => void;
  initial?: ReminderValue | null;
  defaultDate: string;
  defaultTime?: string;
}) {
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [view, setView] = useState(firstOfMonth(initial?.date ?? defaultDate));
  const [mode, setMode] = useState<"date" | "time">("date");
  const { h12, m, ap } = splitTime(initial?.time ?? defaultTime);
  const [hour, setHour] = useState(h12);
  const [minute, setMinute] = useState(m);
  const [meridiem, setMeridiem] = useState(ap);

  useEffect(() => {
    if (!open) return;
    const d = initial?.date ?? defaultDate;
    setDate(d);
    setView(firstOfMonth(d));
    const t = splitTime(initial?.time ?? defaultTime);
    setHour(t.h12);
    setMinute(t.m);
    setMeridiem(t.ap);
    setMode("date");
  }, [open, initial, defaultDate, defaultTime]);

  const grid = monthGrid(view);
  const selected = parseISO(date);
  const dateLabel = selected.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = `${hour}:${pad(minute)} ${meridiem}`;

  return (
    <Modal open={open} onClose={onClose} title="Set reminder time">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">Time</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("date")}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
              mode === "date" ? "bg-lime text-ink" : "bg-cream text-inksoft hover:bg-line"
            }`}
          >
            {dateLabel}
          </button>
          <button
            type="button"
            onClick={() => setMode("time")}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
              mode === "time" ? "bg-lime text-ink" : "bg-cream text-inksoft hover:bg-line"
            }`}
          >
            {timeLabel}
          </button>
        </div>
      </div>

      {mode === "date" ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView(shiftMonth(view, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-inksoft hover:bg-cream"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] font-bold text-ink">{monthTitle(view)}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView(shiftMonth(view, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-inksoft hover:bg-cream"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {WD.map((w, i) => (
              <span
                key={i}
                className="py-1 text-center text-[10px] font-semibold uppercase text-faint"
              >
                {w}
              </span>
            ))}
          </div>

          <div className="space-y-0.5">
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((cell) => {
                  const isSel = cell.iso === date;
                  const dim = !cell.inMonth;
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      disabled={dim}
                      onClick={() => setDate(cell.iso)}
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold transition ${
                        isSel
                          ? "bg-lime text-ink"
                          : dim
                            ? "text-faint/40"
                            : "text-inksoft hover:bg-cream"
                      }`}
                    >
                      {parseISO(cell.iso).getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-stretch gap-2">
          <Wheel value={String(hour)} options={Array.from({ length: 12 }, (_, i) => String(i + 1))} onChange={(v) => setHour(Number(v))} />
          <Wheel
            value={pad(minute)}
            options={Array.from({ length: 60 }, (_, i) => pad(i))}
            onChange={(v) => setMinute(Number(v))}
          />
          <Wheel value={meridiem} options={["AM", "PM"]} onChange={setMeridiem} />
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-btn border border-line bg-paper py-3 text-[13px] font-semibold text-inksoft transition hover:bg-cream"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave({ date, time: joinTime(hour, minute, meridiem) })}
          className="flex-1 rounded-btn bg-lime py-3 text-[13px] font-bold text-ink transition hover:bg-lime-deep"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
