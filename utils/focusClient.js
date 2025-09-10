// /utils/focusClient.js
import { parseFocusText } from "./parseFocus";

// read response safely (even when not JSON)
async function readResponse(res) {
  const text = await res.text();
  try { return { json: JSON.parse(text), raw: text }; }
  catch { return { json: null, raw: text }; }
}

export async function tryHandleFocusCommand(rawText) {
  if (!/^block\s/i.test(rawText || "")) return { handled: false };

  const parsed = parseFocusText(rawText);
  if (!parsed.ok) {
    return { handled: true, ok: false, message: parsed.error };
  }

  const evt = parsed.data;

  // 1) Conflict check
  let conflictNote = "";
  try {
    const r = await fetch("/api/google/calendar/freebusy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startISO: evt.startISO,
        endISO: evt.endISO,
        timezone: evt.timezone,
      }),
    });

    if (r.status === 401) {
      // Not connected yet → server will own the redirect
      const { json } = await readResponse(r);
      if (json?.authUrl) {
        window.location.href = json.authUrl;
        return { handled: true, ok: false, message: "Redirecting to connect Google…" };
      }
      return { handled: true, ok: false, message: "Google not connected" };
    }

    const { json } = await readResponse(r);
    if (r.ok && Array.isArray(json?.conflicts) && json.conflicts.length > 0) {
      const first = json.conflicts[0];
      const names =
        json.conflicts
          .slice(0, 3)
          .map((x) => x.summary)
          .join(", ") + (json.conflicts.length > 3 ? "…" : "");
      conflictNote = ` ⚠️ Overlaps with ${names}`;
      // (Optional) You could early-return here to ask the user to confirm.
    }
  } catch {
    // silent: conflict check failing shouldn't block creation
  }

  // 2) Create the event
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
    const serverMsg = json?.error || raw || `Server error ${res.status}`;
    return { handled: true, ok: false, message: serverMsg };
  }

  if (json?.htmlLink) {
    try { window.open(json.htmlLink, "_blank", "noopener,noreferrer"); } catch {}
  }
  return { handled: true, ok: true, message: `Focus block created.${conflictNote}` };
}
