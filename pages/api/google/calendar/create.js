import {
  calendarClient,
  hydrateClientFromCookie,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  const { parsed } = req.body || {};
  if (!parsed?.title || !parsed?.startISO || !parsed?.endISO || !parsed?.timezone) {
    res.status(400).json({ ok: false, message: "Missing fields" });
    return;
  }

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
    const cal = calendarClient(oauth2);
    const insert = await cal.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: parsed.title,
        location: parsed.location || "",
        start: { dateTime: parsed.startISO, timeZone: parsed.timezone },
        end: { dateTime: parsed.endISO, timeZone: parsed.timezone },
      },
    });

    res.status(200).json({ ok: true, created: insert.data });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: "Failed to create event",
      error: String(err?.message || err),
    });
  }
}
