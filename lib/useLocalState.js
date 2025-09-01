// lib/useLocalState.js
import { useEffect, useState } from "react";

/**
 * Persist a piece of state in localStorage.
 * Usage:
 *   const [value, setValue] = useLocalState("key", initialValue)
 */
export function useLocalState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue];
}
