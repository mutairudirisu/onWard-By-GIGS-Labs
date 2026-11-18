"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  BellRing,
  CalendarPlus,
  Check,
  EyeOff,
  Minus,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/auth";
import { Modal } from "@/components/modal";
import { useNotifications } from "@/components/notifications";
import { useStore } from "@/components/store";
import { toastError, toastSuccess } from "@/components/toast";
import { todayISO } from "@/lib/dates";
import { ALARM_TONES, playAlarm, primeAlarm, useAlarmTone } from "@/lib/alarm";
import { useLocalState } from "@/lib/local-state";
import { cancelPushNotification, registerPushSubscription, schedulePushNotification } from "@/lib/push-client";
import { haptic } from "@/lib/haptics";
import { emitNotice } from "@/lib/notices";
import { uuid } from "@/lib/db";

/**
 * The pomodoro block from a phone's home screen, living inside the app so a focus
 * session does not need another app. The running block stays on this device and is
 * kept as the time it ends at; scheduled starts are also registered with push so
 * they can arrive when the app is closed.
 */

const FOCUS = { min: 5, max: 60, step: 5 };
const BREAK = { min: 1, max: 15, step: 1 };

type Mode = "focus" | "break";
type ScheduledFocus = {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  backgroundPush?: boolean;
};

function localDateTimeValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

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
  const { permission, enableAlerts, pushReady, pushError } = useNotifications();
  const [timer, setTimer] = useLocalState<Timer>(
    user ? `onward.timer.v1:${user.id}` : null,
    fresh(),
  );
  const [now, setNow] = useState(() => Date.now());
  const [menu, setMenu] = useState(false);
  const [tone, setTone] = useAlarmTone(user ? user.id : null);
  const [scheduledFocus, setScheduledFocus, schedulesLoaded] = useLocalState<ScheduledFocus[]>(
    user ? `onward.focus-schedules.v1:${user.id}` : null,
    [],
  );
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("Focus session");
  const [scheduleAt, setScheduleAt] = useState(() =>
    localDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)),
  );
  const [scheduleDuration, setScheduleDuration] = useState(25);

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

  async function saveFocusSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const timestamp = new Date(scheduleAt).getTime();
    const title = scheduleTitle.trim();
    if (!title || !Number.isFinite(timestamp) || timestamp <= Date.now()) {
      toastError("Enter a title and choose a future start time.");
      return;
    }

    const schedule: ScheduledFocus = {
      id: uuid(),
      title: title.slice(0, 80),
      scheduledAt: new Date(timestamp).toISOString(),
      durationMinutes: scheduleDuration,
    };
    setScheduledFocus((current) => [...current, schedule]);
    setScheduleOpen(false);
    setMenu(false);

    try {
      if (!settings.notifications) {
        throw new Error("Turn on Push notifications in Settings to receive this while the app is closed.");
      }
      if (permission !== "granted") {
        const nextPermission = await enableAlerts();
        if (nextPermission !== "granted") {
          throw new Error("Allow notifications in your browser to receive this while the app is closed.");
        }
      }
      await registerPushSubscription();
      await schedulePushNotification({
        kind: "focus",
        eventId: schedule.id,
        scheduledAt: schedule.scheduledAt,
        title: "Focus session begins",
        body: `${schedule.title} · ${schedule.durationMinutes} minute focus session`,
        href: "/today",
        data: {
          scheduleId: schedule.id,
          focusTitle: schedule.title,
          durationMinutes: schedule.durationMinutes,
        },
      });
      setScheduledFocus((current) =>
        current.map((entry) =>
          entry.id === schedule.id ? { ...entry, backgroundPush: true } : entry,
        ),
      );
      toastSuccess("Focus session scheduled");
    } catch (error) {
      toastError(
        `Saved on this device only. ${error instanceof Error ? error.message : "Background push could not be scheduled."}`,
      );
    }
  }

  function removeFocusSchedule(schedule: ScheduledFocus) {
    setScheduledFocus((current) => current.filter((entry) => entry.id !== schedule.id));
    if (schedule.backgroundPush) {
      void cancelPushNotification("focus", schedule.id).catch((error: unknown) =>
        toastError(error instanceof Error ? error.message : "Could not cancel the scheduled notification."),
      );
    }
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
          {pushReady ? (
            <p className="px-3 py-3 text-[12px] leading-[1.55] text-muted">
              Background push is enabled on this device.
            </p>
          ) : pushError ? (
            <p className="px-3 py-3 text-[12px] leading-[1.55] text-muted">{pushError}</p>
          ) : permission === "denied" ? (
            <p className="px-3 py-3 text-[12px] leading-[1.55] text-muted">
              This browser blocks notifications. Focus sessions can still be scheduled for when the app is open.
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
          <button
            type="button"
            onClick={() => {
              setMenu(false);
              setScheduleOpen(true);
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-[12.5px] font-semibold text-ink transition hover:bg-cream"
          >
            <CalendarPlus className="h-4 w-4 shrink-0 text-inksoft" strokeWidth={2} />
            Schedule a focus session
          </button>
          {schedulesLoaded && scheduledFocus.length ? (
            <div className="px-3 pb-2">
              <p className="pb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                Upcoming sessions
              </p>
              {scheduledFocus
                .slice()
                .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
                .map((schedule) => (
                  <div key={schedule.id} className="flex items-center gap-2 py-1.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-ink">{schedule.title}</span>
                      <span className="block text-[10px] text-muted">
                        {new Date(schedule.scheduledAt).toLocaleString()} · {schedule.durationMinutes} min
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Cancel ${schedule.title}`}
                      onClick={() => removeFocusSchedule(schedule)}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
            </div>
          ) : null}

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
      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule a focus session">
        <form className="space-y-3" onSubmit={(event) => void saveFocusSchedule(event)}>
          <label className="block">
            <span className="label">Session title</span>
            <input
              value={scheduleTitle}
              onChange={(event) => setScheduleTitle(event.target.value)}
              maxLength={80}
              required
              className="field-input"
            />
          </label>
          <label className="block">
            <span className="label">Start time</span>
            <input
              type="datetime-local"
              value={scheduleAt}
              min={localDateTimeValue(new Date())}
              onChange={(event) => setScheduleAt(event.target.value)}
              required
              className="field-input"
            />
          </label>
          <label className="block">
            <span className="label">Duration</span>
            <select
              value={scheduleDuration}
              onChange={(event) => setScheduleDuration(Number(event.target.value))}
              className="field-input"
            >
              {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((minutes) => (
                <option key={minutes} value={minutes}>{minutes} minutes</option>
              ))}
            </select>
          </label>
          <p className="text-[10px] leading-[1.5] text-muted">
            Push notifications alert you at the scheduled time. Tap Start focus to begin the timer.
          </p>
          <button
            type="submit"
            className="w-full cursor-pointer rounded-btn bg-lime px-4 py-3 text-[12px] font-bold text-dark transition hover:bg-lime-deep"
          >
            Schedule session
          </button>
        </form>
      </Modal>
    </section>
  );
}

export function FocusTimerScheduler() {
  const { user } = useAuth();
  const { settings } = useStore();
  const [tone] = useAlarmTone(user ? user.id : null);
  const [timer, setTimer, loaded] = useLocalState<Timer>(
    user ? `onward.timer.v1:${user.id}` : null,
    fresh(),
  );
  const [scheduledFocus, setScheduledFocus, schedulesLoaded] = useLocalState<ScheduledFocus[]>(
    user ? `onward.focus-schedules.v1:${user.id}` : null,
    [],
  );
  const [now, setNow] = useState(() => Date.now());
  const [completion, setCompletion] = useState<{ mode: Mode; endedAt: number } | null>(null);
  const handledEnd = useRef<number | null>(null);
  const handledStarts = useRef(new Set<string>());

  const running = timer.endsAt != null;
  const remaining = running
    ? Math.max(0, Math.round(((timer.endsAt ?? 0) - now) / 1000))
    : timer.remainingSec;

  const startScheduledFocus = useCallback(
    (scheduleId: string, durationMinutes: number) => {
      if (
        handledStarts.current.has(scheduleId) ||
        !Number.isInteger(durationMinutes) ||
        durationMinutes < FOCUS.min ||
        durationMinutes > FOCUS.max
      ) {
        return;
      }
      handledStarts.current.add(scheduleId);
      const durationSec = durationMinutes * 60;
      setTimer((current) => ({
        ...current,
        mode: "focus",
        focusMin: durationMinutes,
        remainingSec: durationSec,
        blockSec: durationSec,
        endsAt: Date.now() + durationSec * 1000,
        day: todayISO(),
      }));
      setScheduledFocus((current) => current.filter((entry) => entry.id !== scheduleId));
    },
    [setScheduledFocus, setTimer],
  );

  useEffect(() => {
    if (!loaded || !schedulesLoaded) return;
    const params = new URLSearchParams(window.location.search);
    const scheduleId = params.get("focusSchedule");
    const shouldStart = params.get("startFocus") === "1";
    if (!scheduleId) return;

    if (shouldStart) {
      startScheduledFocus(scheduleId, Number(params.get("duration")));
    } else {
      setScheduledFocus((current) => current.filter((entry) => entry.id !== scheduleId));
    }

    params.delete("focusSchedule");
    params.delete("startFocus");
    params.delete("duration");
    params.delete("title");
    params.delete("focusEventId");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, [loaded, schedulesLoaded, setScheduledFocus, startScheduledFocus]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<{
      type?: string;
      scheduleId?: string;
      durationMinutes?: number;
    }>) => {
      const message = event.data;
      if (message?.type !== "START_FOCUS" || !message.scheduleId) return;
      startScheduledFocus(message.scheduleId, Number(message.durationMinutes));
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, [startScheduledFocus]);

  useEffect(() => {
    if (!loaded || !schedulesLoaded || !scheduledFocus.length) return;
    const due = scheduledFocus.filter((entry) => Date.parse(entry.scheduledAt) <= now);
    for (const entry of due) {
      if (handledStarts.current.has(entry.id)) continue;
      const isRecent = now - Date.parse(entry.scheduledAt) < 30 * 60 * 1000;
      if (isRecent) {
        startScheduledFocus(entry.id, entry.durationMinutes);
        emitNotice({
          id: `focus:${user?.id}:${entry.id}`,
          kind: "win",
          title: "Focus session begins",
          body: `${entry.title} · ${entry.durationMinutes} minute focus session`,
          href: "/today",
        });
      } else {
        handledStarts.current.add(entry.id);
        setScheduledFocus((current) => current.filter((schedule) => schedule.id !== entry.id));
      }
      if (entry.backgroundPush) {
        void cancelPushNotification("focus", entry.id).catch((error: unknown) =>
          console.error("Could not clear due focus push schedule", error),
        );
      }
    }
  }, [loaded, now, scheduledFocus, schedulesLoaded, setScheduledFocus, startScheduledFocus, user?.id]);

  useEffect(() => {
    if (!running) return;
    const update = () => setNow(Date.now());
    update();
    const id = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", update);
    };
  }, [running]);

  useEffect(() => {
    if (!scheduledFocus.length) return;
    const update = () => setNow(Date.now());
    const id = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", update);
    };
  }, [scheduledFocus.length]);

  useEffect(() => {
    if (!loaded || !running || remaining > 0 || timer.endsAt == null) return;
    const endedAt = timer.endsAt;
    if (handledEnd.current === endedAt) return;
    handledEnd.current = endedAt;

    const finished = timer.mode;
    const nextMode: Mode = finished === "focus" ? "break" : "focus";
    const nextSeconds = minutesOf(nextMode, timer);
    setTimer((current) => {
      if (current.endsAt !== endedAt) return current;
      const day = todayISO();
      return {
        ...current,
        mode: nextMode,
        endsAt: null,
        remainingSec: nextSeconds,
        blockSec: nextSeconds,
        day,
        done: (current.day === day ? current.done : 0) + (finished === "focus" ? 1 : 0),
      };
    });
    haptic("success", settings.haptics);
    playAlarm(tone);
    toastSuccess(
      finished === "focus" ? "Focus block done — the break is ready" : "Break over — focus is ready",
    );
    setCompletion({ mode: finished, endedAt });
    emitNotice({
      id: `focus-${endedAt}`,
      kind: "win",
      title: finished === "focus" ? "Focus block finished" : "Break finished",
      body:
        finished === "focus"
          ? `A ${timer.focusMin} minute block is done. Take the ${timer.breakMin} minute break.`
          : "Break's done. Start the next block when you are ready.",
      href: "/today",
    });
  }, [loaded, remaining, running, setTimer, settings.haptics, timer, tone]);

  const dismiss = useCallback(() => {
    if (completion) {
      const notificationTag = `focus-${completion.endedAt}`;
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker
          .getRegistration()
          .then((registration) =>
            registration?.getNotifications({ tag: notificationTag }).then((notifications) => {
              notifications.forEach((notification) => notification.close());
            }),
          )
          .catch((error: unknown) => console.warn("Could not dismiss focus notification", error));
      }
    }
    setCompletion(null);
  }, [completion]);

  const startBreak = useCallback(() => {
    if (completion?.mode !== "focus") return;
    primeAlarm();
    haptic("tap", settings.haptics);
    setTimer((current) => {
      const secs =
        current.mode === "break" && current.remainingSec > 0
          ? current.remainingSec
          : minutesOf("break", current);
      return {
        ...current,
        mode: "break",
        remainingSec: secs,
        blockSec: Math.max(current.blockSec, secs),
        endsAt: Date.now() + secs * 1000,
      };
    });
    dismiss();
  }, [completion, dismiss, settings.haptics, setTimer]);

  return (
    <Modal
      open={completion !== null}
      onClose={dismiss}
      title={completion?.mode === "focus" ? "Focus block complete" : "Break complete"}
    >
      <div className="flex flex-col items-center px-2 pb-1 pt-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-pale text-lime-deep">
          <Check className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <p className="mt-4 text-[14px] font-semibold text-ink">
          {completion?.mode === "focus" ? "Nice work. Your break is ready." : "Your break is over."}
        </p>
        <p className="mt-1.5 max-w-[260px] text-[11px] leading-[1.55] text-muted">
          {completion?.mode === "focus"
            ? `You completed a ${timer.focusMin}-minute focus block. Take a ${timer.breakMin}-minute break when you’re ready.`
            : "Take a breath, then start your next focus block whenever you’re ready."}
        </p>
        {completion?.mode === "focus" ? (
          <button
            type="button"
            onClick={startBreak}
            className="mt-5 min-h-10 w-full cursor-pointer rounded-full bg-lime px-5 text-[12px] font-bold text-dark transition hover:bg-lime-deep"
          >
            Start break
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          className={`${completion?.mode === "focus" ? "mt-2" : "mt-5"} min-h-10 w-full cursor-pointer rounded-full border border-line bg-paper px-5 text-[12px] font-bold text-ink transition hover:bg-cream`}
        >
          Close reminder
        </button>
      </div>
    </Modal>
  );
}
