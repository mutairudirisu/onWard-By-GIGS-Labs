"use client";

import { useEffect } from "react";
import { useStore } from "@/components/store";

export function ThemeManager() {
  const { settings, hydrated } = useStore();

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.style.colorScheme = settings.theme;
  }, [settings.theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.reducedMotion = settings.reducedMotion
      ? "true"
      : "false";
  }, [settings.reducedMotion, hydrated]);

  return null;
}
