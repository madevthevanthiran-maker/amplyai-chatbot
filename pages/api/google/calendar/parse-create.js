// pages/api/google/calendar/parse-create.js
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
  const tz =
    typeof timezone === "string" && timezone.trim()
      ? timezone.trim()
      : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  if (!text || !text.trim()) {
    res.status(400).json({ ok: false, message: "Missing 'text' in body" });
    return;
  }

  // Ensure user is connected
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
    // ✅ correct call signature
    const pf = parseFocus(text, new Date(), tz);
    if (!pf.ok) {
      res
        .status(400)
        .json({ ok: false, message: pf.message || "Could not parse" });
      return;
    }

    const { title, startISO, endISO, timezone: parsedTz } = pf.parsed;

    const cal = calendarClient(oauth2);
    const created = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        start: { dateTime: startISO, timeZone: parsedTz },
        end: { dateTime: endISO, timeZone: parsedTz },
      },
    });

    res.status(200).json({ ok: true, parsed: pf.parsed, created: created.data });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: "Failed to parse or create",
      error: String(err?.message || err),
    });
  }
}
