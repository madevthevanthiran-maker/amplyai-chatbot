/**
 * Browser helper to create calendar events from freeform text.
 * Used by the Focus tab in ChatPanel.
 */

export async function createFromFreeform(text, timezone) {
  const r = await fetch("/api/google/calendar/parse-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, timezone }),
  });
  const j = await r.json();
  if (!r.ok || !j.ok) {
    const msg = j?.message || `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return j; // { ok, parsed, created }
}
