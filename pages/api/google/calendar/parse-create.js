import parseFocus from "../../../../utils/parseFocus";
import {
  hydrateClientFromCookie,
  calendarClient,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { text, timezone } = req.body || {};
  if (!text) {
    res.status(400).json({ ok: false, message: "Missing 'text' in body" });
    return;
  }

  // Ensure we have tokens
  const { oauth2, ready } = await hydrateClientFromCookie(req, res);
  if (!ready) {
    res.status(401).json({
      ok: false,
      message: "Not connected",
      hint: "Open Settings → Connect Google; then refresh.",
    });
    return;
  }

  try {
    const parsed = parseFocus(text, { timezone });
    const cal = calendarClient(oauth2);

    const created = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: parsed.title,
        start: { dateTime: parsed.startISO, timeZone: parsed.timezone },
        end: { dateTime: parsed.endISO, timeZone: parsed.timezone },
      },
    });

    res.status(200).json({ ok: true, parsed, created: created.data });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: "Failed to parse or create",
      error: String(err?.message || err),
    });
  }
}
