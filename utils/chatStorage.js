// utils/chatStorage.js
const KEY = (tabId) => `amplyai.v1.chat.${tabId}`;

export function loadChat(tabId) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY(tabId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveChat(tabId, messages) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY(tabId), JSON.stringify(messages));
  } catch {
    // ignore quota / private browsing write errors
  }
}

export function clearChat(tabId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY(tabId));
  } catch {}
}
