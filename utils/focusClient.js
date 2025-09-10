// /utils/focusClient.js
//
// Handles "block ..." chat messages and creates calendar events via API.

import { parseFocusText } from "./parseFocus";

// Safely read a Response as JSON or raw text
async function readResponse(res) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), raw: text };
  } catch {
    return { json: null, raw: text };
  }
}

export async function tryHandleFocusCommand(rawText) {
  if (!/^block\s/i.test(rawText || "")) {
    return { handled: false };
  }

  const parsed = parseFocusText(rawText);
  if (!parsed.ok) {
    return { handled: true, ok: false, message: parsed.error };
  }

  const evt = parsed.data;

  const res = await fetch("/api/google/calendar/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: evt.title,
      description: "Created via chat Focus command",
      start: evt.startISO,   // "YYYY-MM-DDTHH:mm:ss" local
      end: evt.endISO,
      timezone: evt.timezone,
      location: "Focus",
    }),
  });

  // Not connected → backend returns an absolute authUrl
  if (res.status === 401) {
    const { json } = await readResponse(res);
    if (json?.authUrl) {
      try {
        window.location.href = json.authUrl;
      } catch {}
      return { handled: true, ok: false, message: "Redirecting to connect Google…" };
    }
    return { handled: true, ok: false, message: "Google not connected" };
  }

  const { json, raw } = await readResponse(res);

  if (!res.ok) {
    const serverMsg = json?.error || raw || `Server error ${res.status}`;
    return { handled: true, ok: false, message: serverMsg };
  }

  if (json?.htmlLink) {
    try {
      window.open(json.htmlLink, "_blank", "noopener,noreferrer");
    } catch {}
  }

  return { handled: true, ok: true, message: "Focus block created" };
}
