// /pages/api/google/calendar/focus.js
// Creates a calendar event from a natural-language command.

import parseFocus from "@/utils/parseFocus"; // ✅ default import (important)
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

  // Ensure Google tokens exist
  const { oauth2, ready } = await hydrateClientFromCookie(req, res);
  if (!ready) {
    return res.status(401).json({
      ok: false,
      message: "Not connected",
      hint: "Open Settings → Connect Google; then refresh.",
    });
  }

  try {
    const parsed = parseFocus(text, { timezone });

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
    return res.status(200).json({
      ok: false,
      message: "Failed to parse or create",
      error: String(err?.message || err),
    });
  }
}
