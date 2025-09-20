import { calendarClientFromCookie } from "../../../../lib/googleClient";
import parseFocus, { parseFocus as parseFocusNamed } from "../../../../utils/parseFocus";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const input = body?.text || "";
    const tz = body?.tz;

    // Ensure import works in either form
    const pf = typeof parseFocus === "function" ? parseFocus : parseFocusNamed;
    const parsed = pf(input, { tz });

    if (!parsed?.ok) {
      return res.status(200).json({ ok: false, error: "Parse failed" });
    }

    const c = await calendarClientFromCookie(req);
    if (!c.ok) {
      return res.status(200).json({
        ok: false,
        error: "No access, refresh token, API key or refresh handler callback is set.",
      });
    }

    const event = {
      summary: parsed.title,
      start: parsed.allDay
        ? { date: parsed.start.slice(0, 10) } // all-day uses date only
        : { dateTime: parsed.start, timeZone: parsed.tz },
      end: parsed.allDay
        ? { date: parsed.end.slice(0, 10) }
        : { dateTime: parsed.end, timeZone: parsed.tz },
      description: `[AmplyAI] intent=${parsed.intent}`,
    };

    const { data } = await c.calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return res.status(200).json({ ok: true, event: data, parsed });
  } catch (e) {
    console.error("[calendar/create] error", e);
    return res.status(200).json({ ok: false, error: e.message || String(e) });
  }
}
