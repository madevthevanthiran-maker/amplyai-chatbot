// /pages/api/google/calendar/create.js
import { ensureCalendarClient } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Use POST" });
  }

  try {
    const { parsed, text } = req.body || {};
    if (!parsed?.title || !parsed?.startISO || !parsed?.endISO) {
      return res.status(400).json({
        ok: false,
        message: "Missing parsed.title/startISO/endISO",
      });
    }
    const cal = await ensureCalendarClient(req, res);

    const created = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: parsed.title,
        start: { dateTime: parsed.startISO, timeZone: parsed.timezone || "UTC" },
        end: { dateTime: parsed.endISO, timeZone: parsed.timezone || "UTC" },
        location: parsed.location || undefined,
        description: text || undefined,
      },
    });

    res.status(200).json({ ok: true, created: created.data });
  } catch (err) {
    res.status(200).json({
      ok: false,
      message: String(err?.message || err),
      hint:
        "If unauthorized/invalid_grant: reconnect Google; ensure OAuth client is Web + redirect matches exactly.",
    });
  }
}
