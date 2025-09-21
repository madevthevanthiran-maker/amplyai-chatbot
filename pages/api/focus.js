// /pages/api/focus.js
// Creates a Google Calendar event from a natural-language line (Focus tab).
// Body: { text: string, timezone?: string }
// Requires user to be connected (OAuth cookie) via Settings.

import parseFocus from "@/utils/parseFocus";
import {
  hydrateClientFromCookie,
  calendarClient,
} from "@/lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { text, timezone } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ ok: false, message: "Missing 'text' in body" });
  }

  // Ensure signed-in and tokens present
  let oauth2, ready;
  try {
    const hydrated = await hydrateClientFromCookie(req, res);
    oauth2 = hydrated.oauth2;
    ready = hydrated.ready;
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Auth hydrate failed", error: String(e?.message || e) });
  }

  if (!ready) {
    return res.status(401).json({
      ok: false,
      message: "Google not connected",
      hint: "Open Settings → Connect Google; then try again.",
    });
  }

  try {
    // Parse the line into title/start/end/timezone
    const parsed = parseFocus(text, { timezone });

    // Create calendar event
    const cal = calendarClient(oauth2);
    const created = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: parsed.title,
        start: { dateTime: parsed.startISO, timeZone: parsed.timezone },
        end:   { dateTime: parsed.endISO,   timeZone: parsed.timezone },
      },
    });

    return res.status(200).json({ ok: true, parsed, created: created.data });
  } catch (err) {
    // Map common parse vs API errors to clearer messages
    const msg = String(err?.message || err);
    const isParse = /parse|date\/time|Invalid Date/i.test(msg);

    return res.status(isParse ? 400 : 500).json({
      ok: false,
      message: isParse ? "Couldn’t parse into a date/time" : "Failed to create event",
      error: msg,
      hint: isParse
        ? "Try formats like: 'next Wed 14:30 call with supplier', 'tomorrow 2-4pm — Deep Work thesis'"
        : "Check Google connection (Settings → Refresh).",
    });
  }
}
