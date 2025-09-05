// lib/storage.js
export const isClient = () => typeof window !== "undefined";

export function safeGet(k, fallback = null) {
  if (!isClient()) return fallback;
  try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}

export function safeSet(k, v) {
  if (!isClient()) return;
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}
