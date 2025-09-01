// hooks/useLocalState.js
import { useEffect, useState } from 'react';

/**
 * Persist any small piece of state to localStorage (browser only).
 * Safe on SSR because it checks for "window" first.
 */
export default function useLocalState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
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
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
