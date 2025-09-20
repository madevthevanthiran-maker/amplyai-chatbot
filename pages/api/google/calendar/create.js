// /pages/api/google/calendar/create.js
import { ensureCalendarClient } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Use POST" });
  }

  try {
    const { parsed, text } = req.body || {};
    const client = await ensureCalendarClient(req, res);

    if (!parsed?.title || !parsed?.startISO || !parsed?.endISO) {
      return res.status(400).json({
        ok: false,
        message: "Missing parsed.title/startISO/endISO",
        hint: "Pass a parsed payload from parseFocus() or your form.",
      });
    }

    const event = {
      summary: parsed.title,
      start: { dateTime: parsed.startISO, timeZone: parsed.timezone || "UTC" },
      end: { dateTime: parsed.endISO, timeZone: parsed.timezone || "UTC" },
      location: parsed.location || undefined,
      description: text || undefined,
    };

    const created = await client.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    res.status(200).json({ ok: true, created: created.data });
  } catch (err) {
    res.status(200).json({
      ok: false,
      message: String(err?.message || err),
      hint:
        "If this says unauthorized/invalid_grant, re-connect Google. " +
        "Make sure your OAuth client is type=Web, and redirect URI matches exactly.",
    });
  }
}
