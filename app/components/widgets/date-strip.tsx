"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/components/providers/store";
import {
  addDays,
  dayNum,
  monthGrid,
  monthTitle,
  parseISO,
  toISO,
  todayISO,
  weekdayLetter,
  weekOf,
  type WeekCell,
} from "@/lib/dates";

function DayCell({
  cell,
  selected,
  onSelect,
}: {
  cell: WeekCell;
  selected: boolean;
  onSelect: () => void;
}) {
  const today = cell.iso === todayISO();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Go to ${cell.iso}`}
      aria-current={selected ? "date" : undefined}
      className="flex flex-col items-center gap-1.5"
    >
      <span className="text-[9px] font-semibold uppercase text-faint">{weekdayLetter(cell.iso)}</span>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-[10px] text-[12px] font-bold transition ${
          selected
            ? "bg-lime text-dark"
            : today
              ? "text-ink ring-1 ring-lime-deep"
              : cell.inMonth
                ? "text-inksoft hover:bg-cream"
                : "text-faint hover:bg-cream"
        }`}
      >
        {dayNum(cell.iso)}
      </span>
    </button>
  );
}

function MonthCalendar({
  viewDate,
  selected,
  onShiftMonth,
  onPick,
}: {
  viewDate: string;
  selected: string;
  onShiftMonth: (dir: number) => void;
  onPick: (iso: string) => void;
}) {
  const weeks = monthGrid(viewDate);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-bold text-ink">{monthTitle(viewDate)}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onShiftMonth(-1)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-inksoft hover:bg-cream"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => onShiftMonth(1)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-inksoft hover:bg-cream"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => (
          <span key={i} className="text-center text-[9px] font-semibold uppercase text-faint">
            {l}
          </span>
        ))}
        {weeks.flat().map((c) => {
          const sel = c.iso === selected;
          const today = c.iso === todayISO();
          return (
            <button
              key={c.iso}
              type="button"
              onClick={() => onPick(c.iso)}
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[11.5px] font-semibold transition ${
                sel
                  ? "bg-lime text-dark"
                  : today
                    ? "text-ink ring-1 ring-lime-deep"
                    : c.inMonth
                      ? "text-inksoft hover:bg-cream"
                      : "text-faint/70 hover:bg-cream"
              }`}
            >
              {dayNum(c.iso)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateStrip() {
  const { selectedDate, setSelectedDate } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [viewDate, setViewDate] = useState(selectedDate);

  const week = weekOf(selectedDate);

  const shiftMonth = (dir: number) => {
    const d = parseISO(viewDate);
    d.setDate(1);
    d.setMonth(d.getMonth() + dir);
    setViewDate(toISO(d));
  };

  return (
    <section className="card px-4 pb-4 pt-3.5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          {expanded ? "Jump to a day" : "This week"}
        </p>
        <div className="flex items-center gap-0.5">
          {!expanded ? (
            <>
              <button
                type="button"
                aria-label="Previous week"
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next week"
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                className="flex h-7 w-7 items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-label="Jump to today"
              onClick={() => {
                setSelectedDate(todayISO());
                setViewDate(todayISO());
              }}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold text-lime-deep transition hover:bg-lime-soft"
            >
              Today
            </button>
          )}
          <button
            type="button"
            aria-label={expanded ? "Collapse calendar" : "Expand calendar"}
            aria-expanded={expanded}
            onClick={() => {
              setExpanded((e) => !e);
              setViewDate(selectedDate);
            }}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
              expanded ? "bg-lime text-dark" : "text-inksoft hover:bg-cream"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded ? (
        <MonthCalendar
          viewDate={viewDate}
          selected={selectedDate}
          onShiftMonth={shiftMonth}
          onPick={(iso) => {
            setSelectedDate(iso);
            setExpanded(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-7">
          {week.map((c) => (
            <DayCell
              key={c.iso}
              cell={c}
              selected={c.iso === selectedDate}
              onSelect={() => setSelectedDate(c.iso)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
