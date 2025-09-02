// lib/persistedChat.ts
export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number; // epoch ms
};

const NS = "amplyai:chat";

export function storageKey(tabId: string) {
  return `${NS}:${tabId}`;
}

export function loadMessages(tabId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(tabId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // basic guard
    return parsed.filter(
      (m) => m && typeof m.content === "string" && typeof m.role === "string"
    );
  } catch {
    return [];
  }
}

export function saveMessages(tabId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(tabId), JSON.stringify(messages));
  } catch {
    // ignore quota errors
  }
}

export function clearMessages(tabId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(tabId));
}

export const newId = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);
