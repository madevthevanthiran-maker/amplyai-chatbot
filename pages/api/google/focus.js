// Creates a calendar event from a natural-language command.
import parseFocus from "@/utils/parseFocus";
import { hydrateClientFromCookie, calendarClient } from "@/lib/googleClient";

export default async function handler(req, res) {
  // ---- CORS / preflight ----
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    // Allow the preflight and stop here
    return res.status(200).end();
  }
  // --------------------------

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { text, timezone } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ ok: false, message: "Missing 'text' in body" });
  }

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
    return res.status(422).json({
      ok: false,
      message: "Failed to parse or create",
      error: String(err?.message || err),
    });
  }
}
