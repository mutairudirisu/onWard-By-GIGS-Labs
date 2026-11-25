"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { LoadingState } from "@/components/ui/loading-state";
import { BottomNav, type TabId } from "@/components/layout/bottom-nav";
import { HomeIndicator } from "@/components/layout/phone-shell";

/**
 * Preview duration in milliseconds. Provides a smooth, polished transition
 * between tab and nav switches without feeling sluggish.
 */
const PREVIEW_DURATION_MS = 320;

function getTabForPath(pathname: string): TabId | null {
  if (pathname === "/today" || pathname.startsWith("/today/")) return "today";
  if (pathname === "/onwards" || pathname.startsWith("/onwards/")) return "onwards";
  if (pathname === "/feed" || pathname.startsWith("/feed/")) return "feed";
  if (pathname === "/network" || pathname.startsWith("/network/")) return "network";
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "you";
  return null;
}

function getRouteLabel(pathname: string): string {
  if (!pathname || pathname === "/") return "Loading…";
  if (pathname === "/today" || pathname.startsWith("/today/")) return "Loading Home…";
  if (pathname === "/onwards/new") return "New onWard…";
  if (pathname === "/onwards" || pathname.startsWith("/onwards/")) return "Loading onWards…";
  if (pathname === "/feed/new") return "Creating post…";
  if (pathname === "/feed" || pathname.startsWith("/feed/")) return "Loading Exchange…";
  if (pathname === "/network" || pathname.startsWith("/network/")) return "Loading Network…";
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "Loading Profile…";
  if (pathname === "/communities/new") return "Creating community…";
  if (pathname === "/communities" || pathname.startsWith("/communities/")) return "Loading Communities…";
  if (pathname === "/notifications") return "Loading Notifications…";
  if (pathname === "/streaks") return "Loading Streaks…";
  if (pathname === "/leaderboard") return "Loading Leaderboard…";
  if (pathname === "/insights") return "Loading Insights…";
  if (pathname === "/student") return "Loading Student Space…";
  if (pathname === "/cv" || pathname.startsWith("/cv/")) return "Loading CV Builder…";
  if (pathname === "/settings") return "Loading Settings…";
  return "Loading…";
}

/**
 * RouteLoadingBoundary previews the reusable LoadingState in the main content area
 * on every tab or navigation switch, while keeping the sidebar and frame fully intact.
 */
export function RouteLoadingBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  const currentPathRef = useRef(pathname);
  const prevPathRef = useRef(pathname);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const safetyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  // Intercept navigation link clicks immediately to trigger the loading preview
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Ignore modified or non-primary clicks
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore anchors, external links, mailto, tel, downloads
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        anchor.hasAttribute("download") ||
        anchor.target === "_blank"
      ) {
        return;
      }

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;

        // Only trigger if destination is a different path
        if (url.pathname !== currentPathRef.current) {
          clearTimers();
          startTimeRef.current = Date.now();
          setTargetPath(url.pathname);
          setIsNavigating(true);

          // Safety reset in case navigation is cancelled or interrupted
          safetyTimerRef.current = setTimeout(() => {
            setIsNavigating(false);
            setTargetPath(null);
          }, 4500);
        }
      } catch {
        // Ignore invalid URL parse
      }
    };

    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPathRef.current) {
        clearTimers();
        startTimeRef.current = Date.now();
        setTargetPath(newPath);
        setIsNavigating(true);
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      clearTimers();
    };
  }, [clearTimers]);

  // Trigger or complete preview when pathname changes
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;

      if (!isNavigating) {
        // Triggered by programmatic navigation or history navigation
        setIsNavigating(true);
        setTargetPath(pathname);
        clearTimers();
        timerRef.current = setTimeout(() => {
          setIsNavigating(false);
          setTargetPath(null);
        }, PREVIEW_DURATION_MS);
      } else {
        // Already triggered from click: ensure smooth minimum preview time
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, PREVIEW_DURATION_MS - elapsed);
        clearTimers();
        timerRef.current = setTimeout(() => {
          setIsNavigating(false);
          setTargetPath(null);
        }, remaining);
      }
    }
  }, [pathname, isNavigating, clearTimers]);

  const activePath = targetPath ?? pathname;
  const label = getRouteLabel(activePath);
  const activeTab = getTabForPath(activePath);

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col">
      {/* Content wrapper: stays mounted so page effects and data queries run */}
      <div className={isNavigating ? "hidden" : "flex min-h-dvh flex-1 flex-col"}>
        {children}
      </div>

      {/* Loading state preview: displayed strictly in the main content slot */}
      {isNavigating ? (
        <div
          className="flex min-h-dvh flex-1 flex-col"
          style={{ animation: "onward-fade 0.15s ease-out" }}
        >
          <main className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
            <LoadingState
              variant="page"
              label={label}
              size="md"
            />
          </main>
          {activeTab ? (
            <div className="fixed inset-x-0 bottom-0 z-40 w-full bg-cream md:hidden">
              <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-cream via-cream/70 to-transparent" />
              <BottomNav active={activeTab} />
              <HomeIndicator />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default RouteLoadingBoundary;
