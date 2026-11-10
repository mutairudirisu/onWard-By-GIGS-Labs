"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, Check, EyeOff, Minus, MoreHorizontal, Music2, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { useAuth } from "@/components/auth";
import { Modal } from "@/components/modal";
import { useNotifications } from "@/components/notifications";
import { useStore } from "@/components/store";
import { toastSuccess } from "@/components/toast";
import { todayISO } from "@/lib/dates";
import { ALARM_TONES, playAlarm, primeAlarm, useAlarmTone } from "@/lib/alarm";
import { useLocalState } from "@/lib/local-state";
import { haptic } from "@/lib/haptics";
import { emitNotice } from "@/lib/notices";

/**
 * The pomodoro block from a phone's home screen, living inside the app so a focus
 * session does not need another app. Nothing here goes to the server: the block is
 * a clock, and the clock is kept as the time it ends at, so a reload or a locked
 * phone does not quietly hand minutes back.
 */

const FOCUS = { min: 5, max: 60, step: 5 };
const BREAK = { min: 1, max: 15, step: 1 };

type Mode = "focus" | "break";

type Timer = {
  mode: Mode;
  focusMin: number;
  breakMin: number;
  /** Where a paused block sits. */
  remainingSec: number;
  /** How long the whole block was, so the ring shows the true fraction left. */
  blockSec: number;
  endsAt: number | null;
  day: string;
  done: number;
};

const minutesOf = (mode: Mode, t: Pick<Timer, "focusMin" | "breakMin">) =>
  (mode === "focus" ? t.focusMin : t.breakMin) * 60;

const fresh = (): Timer => ({
  mode: "focus",
  focusMin: 25,
  breakMin: 5,
  remainingSec: 25 * 60,
  blockSec: 25 * 60,
  endsAt: null,
  day: todayISO(),
  done: 0,
});

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const RADIUS = 27;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PomodoroWidget({ onHide }: { onHide: () => void }) {
  const { user } = useAuth();
  const { settings } = useStore();
  const { permission, enableAlerts } = useNotifications();
  const [timer, setTimer] = useLocalState<Timer>(
    user ? `onward.timer.v1:${user.id}` : null,
    fresh(),
  );
  const [now, setNow] = useState(() => Date.now());
  const [menu, setMenu] = useState(false);
  const [tone, setTone] = useAlarmTone(user ? user.id : null);
  const settled = useRef(false);

  const running = timer.endsAt != null;
  const remaining = running
    ? Math.max(0, Math.round(((timer.endsAt ?? 0) - now) / 1000))
    : timer.remainingSec;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  const finish = useCallback(
    (finished: Mode) => {
      const nextMode: Mode = finished === "focus" ? "break" : "focus";
      setTimer((t) => {
        const day = todayISO();
        const secs = minutesOf(nextMode, t);
        return {
          ...t,
          mode: nextMode,
          endsAt: null,
          remainingSec: secs,
          blockSec: secs,
          day,
          done: (t.day === day ? t.done : 0) + (finished === "focus" ? 1 : 0),
        };
      });
      haptic("success", settings.haptics);
      playAlarm(tone);
      toastSuccess(
        finished === "focus" ? "Focus block done — the break is ready" : "Break over — focus is ready",
      );
      emitNotice({
        kind: "win",
        title: finished === "focus" ? "Focus block finished" : "Break finished",
        body:
          finished === "focus"
            ? `A ${timer.focusMin} minute block is in the day. Take the ${timer.breakMin} minute break.`
            : "Break's done. Start the next block when you are ready.",
        href: "/today",
      });
    },
    [setTimer, settings.haptics, timer.breakMin, timer.focusMin, tone],
  );

  // A block that reaches zero while you are on another screen still settles the
  // moment this one paints again, and only once.
  useEffect(() => {
    if (!running || remaining > 0) return;
    if (settled.current) return;
    settled.current = true;
    finish(timer.mode);
  }, [finish, remaining, running, timer.mode]);

  useEffect(() => {
    if (!running) settled.current = false;
  }, [running]);

  function toggleRun() {
    haptic("tap", settings.haptics);
    // The only tap in the whole block, so this is where the browser lets sound in.
    primeAlarm();
    setTimer((t) => {
      if (t.endsAt != null) {
        return {
          ...t,
          endsAt: null,
          remainingSec: Math.max(0, Math.round((t.endsAt - Date.now()) / 1000)),
        };
      }
      const secs = t.remainingSec > 0 ? t.remainingSec : minutesOf(t.mode, t);
      return {
        ...t,
        remainingSec: secs,
        blockSec: Math.max(t.blockSec, secs),
        endsAt: Date.now() + secs * 1000,
      };
    });
  }

  function nudge(direction: 1 | -1) {
    setTimer((t) => {
      if (t.endsAt != null) return t;
      const bounds = t.mode === "focus" ? FOCUS : BREAK;
      const next = clamp(
        (t.mode === "focus" ? t.focusMin : t.breakMin) + direction * bounds.step,
        bounds.min,
        bounds.max,
      );
      const secs = next * 60;
      return {
        ...t,
        ...(t.mode === "focus" ? { focusMin: next } : { breakMin: next }),
        remainingSec: secs,
        blockSec: secs,
      };
    });
  }

  function pickMode(mode: Mode) {
    setTimer((t) => {
      if (t.mode === mode) return t;
      const secs = minutesOf(mode, t);
      return { ...t, mode, endsAt: null, remainingSec: secs, blockSec: secs };
    });
    haptic("tap", settings.haptics);
  }

  function reset() {
    setTimer((t) => {
      const secs = minutesOf(t.mode, t);
      return { ...t, endsAt: null, remainingSec: secs, blockSec: secs };
    });
    setMenu(false);
  }

  const fraction = timer.blockSec > 0 ? clamp(remaining / timer.blockSec, 0, 1) : 0;
  const doneToday = timer.day === todayISO() ? timer.done : 0;

  return (
    <section className="card px-4 py-4" aria-label="Focus timer">
      <div className="flex items-center gap-2">
        <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
          Focus timer
        </h3>
        <span className="min-w-0 flex-1" />
        <button
          type="button"
          aria-label="Timer options"
          aria-haspopup="dialog"
          onClick={() => setMenu(true)}
          className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-inksoft transition hover:bg-cream"
        >
          <MoreHorizontal className="h-[17px] w-[17px]" />
        </button>
      </div>

      <p className="mt-1 text-[10.5px] leading-[1.5] text-muted">
        Work one block, take the break, then start the next.
      </p>

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={toggleRun}
          aria-label={running ? `Pause, ${clock(remaining)} left` : `Start the ${timer.mode} block`}
          className="relative flex h-[72px] w-[72px] shrink-0 cursor-pointer items-center justify-center rounded-full transition active:scale-95"
        >
          <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke="rgb(var(--line))"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke="rgb(var(--lime-deep))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
            />
          </svg>
          {running ? (
            <Pause className="h-5 w-5 fill-current text-ink" strokeWidth={0} />
          ) : (
            <Play className="h-5 w-5 fill-current text-ink" strokeWidth={0} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              aria-label={`Shorten the ${timer.mode} block`}
              disabled={running}
              onClick={() => nudge(-1)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-cream disabled:cursor-default disabled:text-faint"
            >
              <Minus className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <p className="text-[24px] font-bold leading-none tracking-tight text-ink tabular-nums">
              {clock(remaining)}
            </p>
            <button
              type="button"
              aria-label={`Lengthen the ${timer.mode} block`}
              disabled={running}
              onClick={() => nudge(1)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-cream disabled:cursor-default disabled:text-faint"
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>

          <div
            role="group"
            aria-label="Block type"
            className="mt-2.5 flex w-full items-center gap-1 rounded-full border border-line bg-cream p-1"
          >
            {(["focus", "break"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={timer.mode === mode}
                onClick={() => pickMode(mode)}
                className={`flex-1 cursor-pointer rounded-full py-1.5 text-[11px] font-bold capitalize transition ${
                  timer.mode === mode
                    ? "bg-ink text-paper"
                    : "text-muted hover:text-ink"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-[1.5] text-muted">
        {doneToday === 0
          ? "No focus block finished today yet."
          : `${doneToday} focus block${doneToday === 1 ? "" : "s"} finished today.`}
      </p>

      <Modal open={menu} onClose={() => setMenu(false)} title="Focus timer">
        <div className="flex flex-col gap-1">
          {permission === "granted" ? (
            <p className="px-3 py-3 text-[12px] leading-[1.55] text-muted">
              Alerts are on, so a finished block will ring even with onWard closed.
            </p>
          ) : permission === "denied" ? (
            <p className="px-3 py-3 text-[12px] leading-[1.55] text-muted">
              This browser has alerts blocked for onWard, so a finished block only shows here.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                void enableAlerts();
                setMenu(false);
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-[12.5px] font-semibold text-ink transition hover:bg-cream"
            >
              <BellRing className="h-4 w-4 shrink-0 text-inksoft" strokeWidth={2} />
              Turn on alerts
            </button>
          )}

          <div className="mt-1 border-t border-line pt-2">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              Alarm tone
            </p>
            {ALARM_TONES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTone(option.id);
                  // The tap itself is what lets the browser play the preview.
                  primeAlarm();
                  playAlarm(option.id);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold text-ink transition hover:bg-cream"
              >
                <Music2 className="h-4 w-4 shrink-0 text-inksoft" strokeWidth={2} />
                <span className="min-w-0 flex-1">{option.label}</span>
                {tone === option.id ? (
                  <Check className="h-4 w-4 shrink-0 text-lime-deep" strokeWidth={2.4} />
                ) : null}
              </button>
            ))}
            <p className="px-3 pb-1 pt-1 text-[10px] leading-[1.5] text-muted">
              Tap a tone to hear it. The checklist reminder rings with the same one.
            </p>
          </div>

          <div className="mt-2 border-t border-line" aria-hidden />

          <button
            type="button"
            onClick={reset}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-[12.5px] font-semibold text-ink transition hover:bg-cream"
          >
            <RotateCcw className="h-4 w-4 shrink-0 text-inksoft" strokeWidth={2} />
            Reset to {timer.mode === "focus" ? timer.focusMin : timer.breakMin} minutes
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
      </Modal>
    </section>
  );
}
