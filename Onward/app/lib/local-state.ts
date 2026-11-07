"use client";

import { useEffect, useState } from "react";

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
    if (!key || !loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode or a full quota — the widget still works for this session */
    }
  }, [key, loaded, value]);

  return [value, setValue, loaded];
}
