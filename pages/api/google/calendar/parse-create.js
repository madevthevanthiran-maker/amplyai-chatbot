// /pages/api/google/calendar/parse-create.js
import parseFocus from "@/utils/parseFocus";
import { ensureOAuthWithCookie, calendarClient } from "@/lib/googleClient";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { text, timezone } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ ok: false, message: "Missing 'text' in body" });
  }

  const { oauth2, hasTokens } = ensureOAuthWithCookie(req, res);
  if (!hasTokens) {
    return res.status(401).json({
      ok: false,
      message: "Not connected",
      hint: "Open Settings → Connect Google; then refresh.",
    });
  }

  try {
    const parsed = parseFocus(text, new Date(), { timezone }); // ✅ FIXED LINE
    const cal = calendarClient(oauth2);

    const created = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: parsed.title,
        start: { dateTime: parsed.startISO, timeZone: parsed.timezone },
        end: { dateTime: parsed.endISO, timeZone: parsed.timezone },
      },
    });

    return res.status(200).json({ ok: true, parsed, created: created.data });
  } catch (e) {
    return res.status(422).json({
      ok: false,
      message: "Failed to parse or create",
      error: String(e?.message || e),
    });
  }
}
