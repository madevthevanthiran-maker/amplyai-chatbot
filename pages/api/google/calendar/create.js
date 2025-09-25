// /pages/api/google/calendar/create.js
import {
  ensureOAuthWithCookie,
  calendarClient,
} from "@/lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { oauth2, hasTokens } = ensureOAuthWithCookie(req, res);
  if (!hasTokens) {
    return res.status(401).json({ ok: false, message: "Not connected" });
  }

  const { summary, description, startISO, endISO, timeZone } = req.body || {};
  if (!summary || !startISO || !endISO) {
    return res.status(400).json({ ok: false, message: "Missing summary/startISO/endISO" });
  }

  try {
    const cal = calendarClient(oauth2);
    const created = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary,
        description: description || "",
        start: { dateTime: startISO, timeZone: timeZone || "UTC" },
        end: { dateTime: endISO, timeZone: timeZone || "UTC" },
      },
    });
    return res.status(200).json({ ok: true, created: created.data });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Create failed", error: String(e?.message || e) });
  }
}
