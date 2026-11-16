"use client";

import { useEffect, useState } from "react";

const DAY = 86_400_000;
/** Away this long counts as "it has been a while", not as a bad week. */
const AWAY = 14 * DAY;
/** Young this long counts as first-time, on this device. */
const NEW = 14 * DAY;

const ANSWERED = "onward.feedback.asked";
const LAST_SEEN = "onward.feedback.lastSeen";
const FIRST_OPEN = "onward.feedback.firstOpen";

/**
 * Private storage is unavailable in a stalled third-party context, and the app still
 * has to work, so every read here is allowed to come back with nothing.
 */
function store(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function number(s: Storage | null, key: string) {
  const raw = Number(s?.getItem(key) ?? "");
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

// A module store rather than a context, for the same reason the toast is one: whoever
// notices the moment is below the provider tree that would have to hand it down.
let ask: string | null = null;
const listeners = new Set<(screen: string | null) => void>();

function emit() {
  for (const listener of listeners) listener(ask);
}

/**
 * Show the card, once per device. Being asked is itself the end of the question: a
 * person who closes it without answering has answered the only thing worth knowing,
 * and asking again buys an annoyance and no data.
 */
export function requestFeedback(screen: string) {
  const s = store();
  if (!s || s.getItem(ANSWERED)) return;
  s.setItem(ANSWERED, new Date().toISOString());
  ask = screen;
  emit();
}

export function closeFeedback() {
  ask = null;
  emit();
}

/**
 * Called on every app open. The first open only records when it happened - there is
 * nothing to compare against yet - and a later open that finds a long gap asks then.
 */
export function markSeen() {
  const s = store();
  if (!s) return;
  const now = Date.now();
  const last = number(s, LAST_SEEN);
  const first = number(s, FIRST_OPEN);
  s.setItem(LAST_SEEN, String(now));
  if (!first) {
    s.setItem(FIRST_OPEN, String(now));
    return;
  }
  if (last && now - last >= AWAY) requestFeedback("return");
}

/** A like is the moment someone is enjoying the app, so it is the moment to ask. */
export function askAfterUpvote() {
  const s = store();
  if (!s) return;
  const first = number(s, FIRST_OPEN);
  if (!first) return;
  if (Date.now() - first <= NEW) requestFeedback("exchange");
}

export function useFeedbackAsk() {
  const [screen, setScreen] = useState<string | null>(null);

  useEffect(() => {
    listeners.add(setScreen);
    setScreen(ask);
    return () => {
      listeners.delete(setScreen);
    };
  }, []);

  return screen;
}
