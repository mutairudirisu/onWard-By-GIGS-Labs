"use client";

import { useEffect } from "react";
import { useStore } from "@/components/store";
import { resolveTheme, useSystemDark } from "@/lib/theme";

export function ThemeManager() {
  const { settings, hydrated } = useStore();
  const systemDark = useSystemDark();
  const theme = resolveTheme(settings.theme, systemDark);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.reducedMotion = settings.reducedMotion
      ? "true"
      : "false";
  }, [settings.reducedMotion, hydrated]);

  return null;
}
