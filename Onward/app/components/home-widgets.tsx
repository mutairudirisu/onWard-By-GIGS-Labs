"use client";

import { useAuth } from "@/components/auth";
import { ChecklistWidget } from "@/components/checklist-widget";
import { PomodoroWidget } from "@/components/pomodoro-widget";
import { useLocalState } from "@/lib/local-state";

/**
 * The two blocks that make the home page something you can work from, not just read.
 * Hiding one is a device choice, so it comes back on the same phone until you say
 * otherwise.
 */

type Hidden = { timer: boolean; checklist: boolean };

export function HomeWidgets() {
  const { user } = useAuth();
  const [hidden, setHidden] = useLocalState<Hidden>(
    user ? `onward.home-widgets.v1:${user.id}` : null,
    { timer: false, checklist: false },
  );

  const show = (key: keyof Hidden) => (
    <button
      type="button"
      onClick={() => setHidden((prev) => ({ ...prev, [key]: false }))}
      className="cursor-pointer text-[10px] font-semibold text-muted underline transition hover:text-ink lg:text-[12px]"
    >
      Show the {key === "timer" ? "timer" : "checklist"}
    </button>
  );

  if (hidden.timer && hidden.checklist) {
    return (
      <div className="mt-4 flex items-center gap-4">
        {show("timer")}
        {show("checklist")}
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {hidden.timer ? (
        <div className="flex items-center">{show("timer")}</div>
      ) : (
        <PomodoroWidget onHide={() => setHidden((prev) => ({ ...prev, timer: true }))} />
      )}
      {hidden.checklist ? (
        <div className="flex items-center">{show("checklist")}</div>
      ) : (
        <ChecklistWidget onHide={() => setHidden((prev) => ({ ...prev, checklist: true }))} />
      )}
    </div>
  );
}
