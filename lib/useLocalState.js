// lib/useLocalState.js
import { useEffect, useState } from "react";

/**
 * React hook that persists state in localStorage (SSR-safe).
 * Usage: const [value, setValue] = useLocalState("key", initialValue)
 */
export default function useLocalState(key, initialValue) {
  const [value, setValue] = useState(() => {
    // During SSR there is no window/localStorage
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = window.localStorage.getItem(key);
      return stored != null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore write failures */
    }
  }, [key, value]);

  return [value, setValue];
}
