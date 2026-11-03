"use client";

import { Modal } from "@/components/modal";
import { Button } from "@/components/ui";
import { formatReminder } from "@/lib/dates";
import { BellOff, Check, Clock, Timer } from "lucide-react";

export type DueReminder = {
  kind: "task" | "note";
  id: string;
  title: string;
  /** The instant the nudge fell due, as UTC ISO. */
  at: string;
  /** True when it went off while onWard was closed. */
  missed: boolean;
  href: string;
};

/**
 * The moment a reminder arrives, in the app. The native notification covers the
 * locked screen and other tabs; this is the one you answer where you are, and the
 * only one that can catch up on a nudge you slept through. Every way out of it
 * acknowledges the reminder, so a missed one cannot re-open on the next load.
 */
export function ReminderAlert({
  due,
  onDone,
  onSnooze,
  onSilence,
  onAcknowledge,
}: {
  due: DueReminder | null;
  onDone: () => void;
  onSnooze: () => void;
  onSilence: () => void;
  onAcknowledge: () => void;
}) {
  return (
    <Modal
      open={Boolean(due)}
      onClose={onAcknowledge}
      title={due?.missed ? "Missed reminder" : "Reminder"}
    >
      {due ? (
        <div>
          <p className="text-[16px] font-bold leading-snug tracking-tight text-ink [overflow-wrap:anywhere] lg:text-[18px]">
            {due.title}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] font-medium text-muted">
            <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
            {due.missed ? "Was due " : ""}
            {formatReminder(due.at)}
          </p>

          <div className="mt-5 flex gap-2">
            <Button
              variant="secondary"
              onClick={onSnooze}
              iconLeft={<Timer className="h-4 w-4" strokeWidth={2.2} />}
            >
              Snooze 10 min
            </Button>
            <Button
              variant="secondary"
              onClick={onSilence}
              className="text-[#E5484D]"
              iconLeft={<BellOff className="h-4 w-4" strokeWidth={2.2} />}
            >
              Silence
            </Button>
          </div>

          <div className="mt-2">
            <Button onClick={onDone} iconLeft={<Check className="h-4 w-4" strokeWidth={2.6} />}>
              {due.kind === "task" ? "Mark done" : "Open note"}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
