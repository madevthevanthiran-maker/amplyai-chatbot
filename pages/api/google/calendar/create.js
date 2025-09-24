// /pages/api/google/calendar/create.js
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

  const { summary, description, startISO, endISO, timeZone = "UTC" } = req.body || {};
  if (!summary || !startISO || !endISO)
    return res.status(400).json({ ok: false, message: "Missing fields" });

  try {
    const cal = calendarClient(tokens);
    const created = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary,
        description,
        start: { dateTime: startISO, timeZone },
        end: { dateTime: endISO, timeZone },
      },
    });
    res.status(200).json({ ok: true, created: created.data });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e?.message || e) });
  }
}
