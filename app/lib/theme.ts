"use client";

import { useEffect, useState } from "react";
import type { Theme } from "./data";

/**
 * The device answer, subscribed to rather than read once: someone on System expects
 * the app to follow the OS at sunset without reloading it.
 */
export function useSystemDark(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(query.matches);
    const onChange = (event: MediaQueryListEvent) => setDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return dark;
}

/** What the screen should actually look like, whichever of the three was chosen. */
export function resolveTheme(theme: Theme, systemDark: boolean): "light" | "dark" {
  return theme === "system" ? (systemDark ? "dark" : "light") : theme;
}
