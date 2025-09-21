// /pages/api/google/calendar/parse-create.js
// Single source of truth for: free-form text → parsed times → Google Calendar event.

import parseFocus from "@/utils/parseFocus";
import { hydrateClientFromCookie, calendarClient } from "@/lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { text, timezone } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ ok: false, message: "Missing 'text' in body" });
  }

  // Ensure Google tokens exist (user connected in Settings)
  const { oauth2, ready } = await hydrateClientFromCookie(req, res);
  if (!ready) {
    return res.status(401).json({
      ok: false,
      message: "Not connected",
      hint: "Open Settings → Connect Google; then Refresh.",
    });
  }

  try {
    // Parse natural language → { title, startISO, endISO, timezone }
    const parsed = parseFocus(text, { timezone });

    // Create event
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
    return res.status(422).json({
      ok: false,
      message: "Failed to parse or create",
      error: String(err?.message || err),
    });
  }
}
