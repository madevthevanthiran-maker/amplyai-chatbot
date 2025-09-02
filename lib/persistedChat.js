// lib/persistedChat.js
export function storageKey(tabId) {
  return `amplyai:chat:${tabId}`;
}

export function loadMessages(tabId) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(tabId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveMessages(tabId, messages) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(storageKey(tabId), JSON.stringify(messages)); } catch {}
}

export function clearMessages(tabId) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(tabId));
}

export const newId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);
