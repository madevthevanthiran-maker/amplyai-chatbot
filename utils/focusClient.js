// /utils/focusClient.js
import { parseFocusCommand } from "./parseFocus";

async function readResponse(res) {
  const text = await res.text();
  try { return { json: JSON.parse(text), raw: text }; }
  catch { return { json: null, raw: text }; }
}

export async function tryHandleFocusCommand(rawText) {
  if (!/^block\s/i.test(rawText || "")) return { handled: false };

  const parsed = parseFocusCommand(rawText);
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
  } catch (e) {
    return { handled: true, ok: false, message: `Network error: ${e.message}` };
  }

  if (res.status === 401) {
    const { json } = await readResponse(res);
    if (json?.authUrl) {
      window.location.href = json.authUrl;
      return { handled: true, ok: false, message: "Redirecting to connect Google…" };
    }
    return { handled: true, ok: false, message: "Google not connected" };
  }

  const { json, raw } = await readResponse(res);
  if (!res.ok) {
    return { handled: true, ok: false, message: json?.error || raw || `Server error ${res.status}` };
  }

  if (json?.htmlLink) {
    try { window.open(json.htmlLink, "_blank", "noopener,noreferrer"); } catch {}
  }
  return { handled: true, ok: true, message: "Focus block created" };
}
