"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const HISTORY_KEY = "onward.navigation-history.v1";

type NavigationHistory = {
  entries: string[];
  index: number;
};

let memoryHistory: NavigationHistory | null = null;

function readHistory(): NavigationHistory | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(HISTORY_KEY);
    if (!stored) return memoryHistory;
    const parsed: unknown = JSON.parse(stored);
    if (
      parsed &&
      typeof parsed === "object" &&
      "entries" in parsed &&
      Array.isArray(parsed.entries) &&
      parsed.entries.every((entry) => typeof entry === "string") &&
      "index" in parsed &&
      typeof parsed.index === "number" &&
      Number.isInteger(parsed.index) &&
      parsed.index >= 0 &&
      parsed.index < parsed.entries.length
    ) {
      return { entries: parsed.entries, index: parsed.index };
    }
    return memoryHistory;
  } catch (error) {
    console.warn("Could not read the app navigation history.", error);
    return memoryHistory;
  }
}

function writeHistory(history: NavigationHistory) {
  memoryHistory = history;
  try {
    window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn("Could not persist the app navigation history.", error);
  }
}

function currentRoute(pathname: string, search: string) {
  const query = new URLSearchParams(search).toString();
  return query ? `${pathname}?${query}` : pathname;
}

function browserRoute() {
  return currentRoute(window.location.pathname, window.location.search);
}

function replaceTrackedRoute(destination: string) {
  const url = new URL(destination, window.location.origin);
  const nextRoute = currentRoute(url.pathname, url.search);
  const history = readHistory();
  if (history && history.entries[history.index] === browserRoute()) {
    history.entries[history.index] = nextRoute;
    writeHistory(history);
    return;
  }
  writeHistory({ entries: [nextRoute], index: 0 });
}

function NavigationHistoryObserver() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = currentRoute(pathname, searchParams.toString());
  const currentRouteRef = useRef(route);
  const popTargetRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      const target = browserRoute();
      popTargetRef.current =
        target === currentRouteRef.current ? null : target;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let history = readHistory();
    if (!initializedRef.current) {
      const navigation = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const isContinuation =
        navigation?.type === "reload" || navigation?.type === "back_forward";
      if (!history || !isContinuation || history.entries[history.index] !== route) {
        history = { entries: [route], index: 0 };
      }
      initializedRef.current = true;
      currentRouteRef.current = route;
      writeHistory(history);
      return;
    }

    if (currentRouteRef.current === route) return;
    if (!history) history = { entries: [currentRouteRef.current], index: 0 };

    const popTarget = popTargetRef.current;
    if (popTarget) {
      popTargetRef.current = null;
      const previous = history.entries[history.index - 1];
      const next = history.entries[history.index + 1];
      if (previous === popTarget) {
        history.index -= 1;
      } else if (next === popTarget) {
        history.index += 1;
      } else {
        const existing = history.entries.lastIndexOf(popTarget);
        history = existing >= 0
          ? { entries: history.entries, index: existing }
          : { entries: [popTarget], index: 0 };
      }
    } else {
      history.entries = history.entries.slice(0, history.index + 1);
      if (history.entries[history.index] !== route) {
        history.entries.push(route);
        history.index = history.entries.length - 1;
      }
    }

    currentRouteRef.current = route;
    writeHistory(history);
  }, [route]);

  return null;
}

export function NavigationHistoryTracker() {
  return (
    <Suspense fallback={null}>
      <NavigationHistoryObserver />
    </Suspense>
  );
}

export function useSmartBack(fallback?: string) {
  const router = useRouter();
  return useCallback(() => {
    const route = browserRoute();
    const history = readHistory();
    if (
      history &&
      history.index > 0 &&
      history.entries[history.index] === route
    ) {
      router.back();
      return;
    }

    if (fallback) {
      replaceTrackedRoute(fallback);
      router.replace(fallback);
    }
  }, [fallback, router]);
}

export function useTrackedReplace() {
  const router = useRouter();
  return useCallback((destination: string) => {
    replaceTrackedRoute(destination);
    router.replace(destination);
  }, [router]);
}
