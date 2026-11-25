"use client";

import { NavigationHistoryTracker } from "@/components/providers/navigation-history";
import { ThemeManager } from "@/components/providers/theme-manager";
import { ChecklistReminderScheduler } from "@/components/widgets/checklist-widget";
import { FocusTimerScheduler } from "@/components/widgets/pomodoro-widget";

/**
 * AppEffects aggregates renderless background schedulers and side-effect trackers.
 * Must be mounted within AppProviders (requires auth and store contexts).
 */
export function AppEffects() {
  return (
    <>
      <NavigationHistoryTracker />
      <ThemeManager />
      <ChecklistReminderScheduler />
      <FocusTimerScheduler />
    </>
  );
}

export default AppEffects;
