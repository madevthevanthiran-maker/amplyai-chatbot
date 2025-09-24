// /pages/api/google/calendar/parse-create.js
import parseFocus from "@/utils/parseFocus";
import { readAuthCookie, calendarClient } from "@/lib/googleClient";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, message: "Method not allowed" });

  const tokens = readAuthCookie(req);
  if (!tokens)
    return res.status(401).json({
      ok: false,
      message: "Not connected",
      hint: "Open Settings → Connect Google; then refresh.",
    });

  const { text, timezone } = req.body || {};
  if (!text || typeof text !== "string")
    return res.status(400).json({ ok: false, message: "Missing 'text'" });

  try {
    const parsed = parseFocus(text, { timezone });
    const cal = calendarClient(tokens);
    const created = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: parsed.title,
        start: { dateTime: parsed.startISO, timeZone: parsed.timezone },
        end: { dateTime: parsed.endISO, timeZone: parsed.timezone },
      },
    });
    res.status(200).json({ ok: true, parsed, created: created.data });
  } catch (e) {
    res.status(422).json({ ok: false, message: "Failed to parse or create", error: String(e?.message || e) });
  }
}
