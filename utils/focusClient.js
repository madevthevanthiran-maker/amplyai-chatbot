// /utils/focusClient.js
import { parseFocusText } from "./parseFocus";

// Safely read JSON body or fallback text
async function readResponse(res) {
  const text = await res.text();
  try { return { json: JSON.parse(text), raw: text }; }
  catch { return { json: null, raw: text }; }
}

export async function tryHandleFocusCommand(rawText) {
  if (!/^block\s/i.test(rawText || "")) return { handled: false };

  let parsed;
  try {
    parsed = parseFocusText(rawText);
  } catch (err) {
    return { handled: true, ok: false, message: err?.message || "Parse error" };
  }
  if (!parsed.ok) return { handled: true, ok: false, message: parsed.error };

  const evt = parsed.data;
  const res = await fetch("/api/google/calendar/create", {
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

  if (res.status === 401) {
    const { json } = await readResponse(res);
    const url = json?.authUrl || "/api/google/oauth/start?state=/settings";
    window.location.href = url;
    return { handled: true, ok: false, message: "Redirecting to connect Google…" };
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
