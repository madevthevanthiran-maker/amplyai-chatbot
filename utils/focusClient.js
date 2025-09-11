// /utils/focusClient.js
import { parseFocusText } from "./parseFocus";

// Helper to read response safely (even when it's not JSON)
async function readResponse(res) {
  const text = await res.text();
  try { return { json: JSON.parse(text), raw: text }; }
  catch { return { json: null, raw: text }; }
}

function formatWhen(start, end) {
  const s = start?.dateTime || start?.date;
  const e = end?.dateTime || end?.date;
  return [s, e].filter(Boolean).join(" → ");
}

export async function tryHandleFocusCommand(rawText) {
  if (!/^block\s/i.test(rawText || "")) return { handled: false };

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
      start: evt.startISO,     // "YYYY-MM-DDTHH:mm:ss"
      end: evt.endISO,
      timezone: evt.timezone,  // e.g., "Australia/Melbourne"
      location: "Focus",
    }),
  });

  // 401 means not connected → redirect to connect
  if (res.status === 401) {
    const { json } = await readResponse(res);
    if (json?.authUrl) {
      try { window.location.href = json.authUrl; } catch {}
      return { handled: true, ok: false, message: "Redirecting to connect Google…" };
    }
    return { handled: true, ok: false, message: "Google not connected" };
  }

  // 409 means conflicts
  if (res.status === 409) {
    const { json } = await readResponse(res);
    const lines = (json?.conflicts || []).slice(0, 5).map((c) => {
      return `• ${c.summary} (${formatWhen(c.start, c.end)})`;
    });
    const msg = [
      "There’s a conflict in that time window:",
      ...lines,
      "Try a different time (e.g., 'block 4–5pm today for …').",
    ].join("\n");
    return { handled: true, ok: false, message: msg };
  }

  const { json, raw } = await readResponse(res);

  if (!res.ok) {
    const serverMsg = json?.error || raw || `Server error ${res.status}`;
    return { handled: true, ok: false, message: serverMsg };
  }

  if (json?.htmlLink) {
    try { window.open(json.htmlLink, "_blank", "noopener,noreferrer"); } catch {}
  }
  return { handled: true, ok: true, message: "Focus block created" };
}
