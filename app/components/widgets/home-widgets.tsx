"use client";

import { ListChecks, Timer } from "lucide-react";
import { useAuth } from "@/components/providers/auth";
import { ChecklistWidget } from "@/components/widgets/checklist-widget";
import { PomodoroWidget } from "@/components/widgets/pomodoro-widget";
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

  const show = (key: keyof Hidden) => {
    const Icon = key === "timer" ? Timer : ListChecks;
    return (
      <button
        type="button"
        onClick={() => setHidden((prev) => ({ ...prev, [key]: false }))}
        className="flex w-max cursor-pointer items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-2 text-[10.5px] font-semibold text-inksoft transition hover:border-dash hover:text-ink lg:text-[11.5px]"
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        Show the {key === "timer" ? "timer" : "checklist"}
      </button>
    );
  };

  if (hidden.timer && hidden.checklist) {
    return (
      <div className="mt-4 flex items-center gap-2.5">
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
