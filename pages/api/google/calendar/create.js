// /pages/api/google/calendar/create.js
import { calendarClientFromCookie } from "../../../../lib/googleClient";
import parseFocus, { parseFocus as parseFocusNamed } from "../../../../utils/parseFocus";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const pf = typeof parseFocus === "function" ? parseFocus : parseFocusNamed;

    let parsed = null;

    if (body.parsed && typeof body.parsed === "object") {
      // Trust a pre-parsed shape from the Settings form
      parsed = {
        ok: true,
        title: body.parsed.title,
        start: body.parsed.start,
        end: body.parsed.end,
        tz: body.parsed.tz || "UTC",
        allDay: !!body.parsed.allDay,
        intent: body.parsed.intent || "event",
      };
    } else {
      const text = body.text || "";
      parsed = pf(text, { tz: body.tz });
    }

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
        ? { date: parsed.start.slice(0, 10) }
        : { dateTime: parsed.start, timeZone: parsed.tz },
      end: parsed.allDay
        ? { date: parsed.end.slice(0, 10) }
        : { dateTime: parsed.end, timeZone: parsed.tz },
      description: `[AmplyAI] intent=${parsed.intent}`,
      location: body.parsed?.location || undefined,
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
