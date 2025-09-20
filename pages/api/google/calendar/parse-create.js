// /pages/api/google/calendar/parse-create.js
import parseFocus from "../../../../utils/parseFocus";
import {
  hydrateClientFromCookie,
  calendarClient,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { text, timezone } = req.body || {};
  if (!text) {
    return res.status(400).json({ ok: false, message: "Missing 'text' in body" });
  }

  // Ensure we have tokens
  const { oauth2, ready } = await hydrateClientFromCookie(req, res);
  if (!ready) {
    return res.status(401).json({
      ok: false,
      message: "Not connected",
      hint: "Open Settings → Connect Google; then refresh.",
    });
  }

  try {
    // ✅ Use new parseFocus API
    const out = parseFocus(text, new Date(), timezone);

    if (!out.ok) {
      return res.status(400).json({
        ok: false,
        message: out.message || "Could not parse focus command",
      });
    }

    const { title, startISO, endISO, timezone: tz } = out.parsed;
    const cal = calendarClient(oauth2);

    const created = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        start: { dateTime: startISO, timeZone: tz },
        end: { dateTime: endISO, timeZone: tz },
      },
    });

    return res.status(200).json({ ok: true, parsed: out.parsed, created: created.data });
  } catch (err) {
    console.error("parse-create error:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to parse or create",
      error: String(err?.message || err),
    });
  }
}
