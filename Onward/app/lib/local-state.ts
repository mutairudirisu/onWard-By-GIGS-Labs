"use client";

import { useEffect, useState } from "react";

const LOCAL_STATE_EVENT = "onward:local-state";

/**
 * State kept on this device only, under a key that names the signed-in account.
 * The home page widgets live here: a checklist and a running timer should survive a
 * reload without waiting on anything in the database.
 */
export function useLocalState<T>(
  key: string | null,
  fallback: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (!key) return;
    let next = fallback;
    try {
      const raw = localStorage.getItem(key);
      if (raw) next = JSON.parse(raw) as T;
    } catch {
      /* unreadable storage simply means a fresh widget */
    }
    setValue(next);
    setLoaded(true);
    // `fallback` is only the shape of an empty widget, so a new key is the only
    // thing that has to re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!key) return;
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ key: string; value: string }>).detail;
      if (detail?.key !== key) return;
      try {
        setValue(JSON.parse(detail.value) as T);
      } catch {
        /* ignore malformed updates from another local-state writer */
      }
    };
    window.addEventListener(LOCAL_STATE_EVENT, sync);
    return () => window.removeEventListener(LOCAL_STATE_EVENT, sync);
  }, [key]);

  useEffect(() => {
    if (!key || !loaded) return;
    try {
      const serialized = JSON.stringify(value);
      if (localStorage.getItem(key) === serialized) return;
      localStorage.setItem(key, serialized);
      window.dispatchEvent(
        new CustomEvent(LOCAL_STATE_EVENT, { detail: { key, value: serialized } }),
      );
    } catch {
      /* private mode or a full quota — the widget still works for this session */
    }
  }, [key, loaded, value]);

  return [value, setValue, loaded];
}
