// /utils/focusClient.js
// Single browser helper used by Chat + Focus page.

export async function createEventFromText(text, timezone) {
  const r = await fetch("/api/google/calendar/focus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, timezone }),
  });

  // Robust JSON read
  let j = null;
  try {
    j = await r.json();
  } catch {
    // ignore
  }

  if (!r.ok || !j?.ok) {
    const msg = j?.error || j?.message || `Calendar create failed (HTTP ${r.status})`;
    throw new Error(msg);
  }

  return j; // { ok: true, parsed, created }
}
