// /utils/focusClient.js
import { parseFocusText } from "./parseFocus";

async function readResponse(res) {
  const text = await res.text();
  try { return { json: JSON.parse(text), raw: text }; }
  catch { return { json: null, raw: text }; }
}

export async function tryHandleFocusCommand(rawText) {
  if (!/^block\s/i.test(rawText || "")) return { handled: false };

  const parsed = parseFocusText(rawText);
  if (!parsed.ok) return { handled: true, ok: false, message: parsed.error };

  const evt = parsed.data;

  // Attempt create
  let res = await fetch("/api/google/calendar/create", {
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

  // Not connected → redirect
  if (res.status === 401) {
    const { json } = await readResponse(res);
    const url = json?.authUrl || "/api/google/oauth/start?state=/settings";
    window.location.href = url;
    return { handled: true, ok: false, message: "Redirecting to connect Google…" };
  }

  // Conflict → ask user whether to create anyway or use suggestion
  if (res.status === 409) {
    const { json } = await readResponse(res);
    const sug = json?.suggested;
    let proceed = false;

    if (sug?.start && sug?.end) {
      proceed = window.confirm(
        `That slot is busy.\nSuggested next free slot:\n${sug.start} → ${sug.end}\n\nOK = use suggested time\nCancel = create anyway at your original time`
      );
      if (proceed) {
        // Try suggested
        res = await fetch("/api/google/calendar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: evt.title,
            description: "Created via chat Focus command (suggested slot)",
            start: sug.start,
            end: sug.end,
            timezone: evt.timezone,
            location: "Focus",
          }),
        });
      } else {
        // Create anyway with override
        res = await fetch("/api/google/calendar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: evt.title,
            description: "Created via chat Focus command (override conflicts)",
            start: evt.startISO,
            end: evt.endISO,
            timezone: evt.timezone,
            location: "Focus",
            allowConflicts: true,
          }),
        });
      }
    } else {
      // No suggestion provided; ask to override
      const override = window.confirm("That time is busy. Create anyway?");
      if (override) {
        res = await fetch("/api/google/calendar/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: evt.title,
            description: "Created via chat Focus command (override conflicts)",
            start: evt.startISO,
            end: evt.endISO,
            timezone: evt.timezone,
            location: "Focus",
            allowConflicts: true,
          }),
        });
      } else {
        return { handled: true, ok: false, message: "Cancelled." };
      }
    }
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
