// lib/useLocalState.js
import { useEffect, useState } from "react";

/**
 * Persist any small piece of state to localStorage.
 * Usage:
 *   const [intent, setIntent] = useLocalState("mailmate.intent", "Cold outreach");
 */
export function useLocalState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored != null ? JSON.parse(stored) : initialValue;
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
