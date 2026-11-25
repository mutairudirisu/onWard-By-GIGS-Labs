"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth";
import { countNewExchangePosts } from "@/lib/db";

/**
 * How many posts other people have put in the Exchange since you last read it.
 * The moment you read it is kept on this device, so the count is honest without
 * needing a server-side "last seen" column.
 */

const SEEN_KEY = "onward.exchange.seen.v1";

export function markExchangeSeen(userId: string) {
  try {
    localStorage.setItem(`${SEEN_KEY}:${userId}`, new Date().toISOString());
  } catch {
    /* private mode — the badge simply starts counting again next session */
  }
}

function readSeen(userId: string): string | null {
  try {
    return localStorage.getItem(`${SEEN_KEY}:${userId}`);
  } catch {
    return null;
  }
}

export function useExchangeBadge(onExchange: boolean): number {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!userId || onExchange) return;
    const since = readSeen(userId);
    // Nobody has opened the Exchange on this device yet, so nothing is "new".
    if (!since) {
      markExchangeSeen(userId);
      return;
    }
    void countNewExchangePosts(since)
      .then(setCount)
      .catch(() => {});
  }, [onExchange, userId]);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    if (onExchange) {
      markExchangeSeen(userId);
      setCount(0);
      return;
    }
    refresh();
  }, [onExchange, refresh, userId]);

  // Coming back to the app is when a badge should have changed.
  useEffect(() => {
    const onView = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onView);
    window.addEventListener("focus", onView);
    return () => {
      document.removeEventListener("visibilitychange", onView);
      window.removeEventListener("focus", onView);
    };
  }, [refresh]);

  return count;
}
