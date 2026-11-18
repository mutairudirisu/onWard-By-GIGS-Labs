"use client";

export type HapticKind = "tap" | "success" | "nudge" | "error";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 10,
  success: [12, 24, 14],
  nudge: [18, 40, 18],
  error: [30, 36, 30],
};

/** iOS Safari ships no vibration API, so the setting can only ever be advisory there. */
export function canVibrate() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** Fire a short vibration where the browser exposes the Vibration API. */
export function haptic(kind: HapticKind = "tap", enabled = true) {
  if (!enabled || typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(PATTERNS[kind]);
  } catch {
    /* some browsers expose the API but reject the pattern */
  }
}
