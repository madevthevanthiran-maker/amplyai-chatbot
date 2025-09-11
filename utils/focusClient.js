// /utils/focusClient.js
import { parseFocusText } from "./parseFocus";

// Safe body reader (handles non-JSON error bodies)
async function readResponse(res) {
  const text = await res.text();
  try {
    return { json: JSON.parse(text), raw: text };
  } catch {
    return { json: null, raw: text };
  }
}

export async function tryHandleFocusCommand(rawText) {
  if (!/^block\s/i.test(rawText || "")) return { handled: false };

  const parsed = parseFocusText(rawText);
  if (!parsed.ok) {
    return { handled: true, ok: false, message: parsed.error };
  }

  const evt = parsed.data;

  let res;
  try {
    res = await fetch("/api/google/calendar/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: evt.title,
        description: "Created via chat Focus command",
        start: evt.startISO,
        end: evt.endISO,
        timezone: evt.timezone,
        location: "Focus",
      }),
    });
  } catch {
    return { handled: true, ok: false, message: "Network error talking to server." };
  }

  if (res.status === 401) {
    const { json } = await readResponse(res);
    const url = json?.authUrl || "/api/google/oauth/start?state=%2Fsettings";
    try {
      window.location.href = url;
      return { handled: true, ok: false, message: "Redirecting to connect…" };
    } catch {
      return { handled: true, ok: false, message: "Google not connected" };
    }
  }

  const { json, raw } = await readResponse(res);

  if (!res.ok) {
    const msg = json?.error || raw || `Server error ${res.status}`;
    return { handled: true, ok: false, message: msg };
  }

  if (json?.htmlLink) {
    try { window.open(json.htmlLink, "_blank", "noopener,noreferrer"); } catch {}
  }

  return { handled: true, ok: true, message: "Focus block created" };
}
