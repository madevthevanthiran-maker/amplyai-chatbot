// /pages/api/google/calendar/create.js
import {
  ensureFreshTokens,
  readTokensFromReq,
  clientWithTokens,
  getAuthUrl,
} from "../../../../lib/googleClient";

function toRFC3339(s) {
  // Accepts "YYYY-MM-DDTHH:mm:ss" and returns RFC3339 with 'Z' (UTC)
  // Calendar accepts local with timeZone too, but RFC3339 avoids ambiguity.
  // We'll keep user's timeZone separately on event.
  return s.endsWith("Z") ? s : s + "Z";
}

function overlaps(busy, startISO, endISO) {
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  return busy.some(({ start, end }) => {
    const bs = new Date(start).getTime();
    const be = new Date(end).getTime();
    // overlap if starts before end and ends after start
    return bs < e && be > s;
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);
    if (!tokens) {
      return res.status(401).json({ error: "Google not connected", authUrl: getAuthUrl(req, "/settings") });
    }

    const {
      title,
      description,
      start,
      end,
      timezone,
      location,
      attendees,
      allowConflicts,
    } = req.body || {};

    if (!title || !start || !end) {
      return res.status(400).json({ error: "Missing required fields: title, start, end" });
    }

    const calendar = clientWithTokens(req, tokens);

    // --- Free/Busy conflict check (unless explicitly allowed) ---
    if (!allowConflicts) {
      const fbReq = {
        requestBody: {
          timeMin: toRFC3339(start),
          timeMax: toRFC3339(end),
          items: [{ id: "primary" }],
          timeZone: timezone || "UTC",
        },
      };
      const { data: fb } = await calendar.freebusy.query(fbReq);
      const busy = fb?.calendars?.primary?.busy || [];

      if (busy.length && overlaps(busy, fbReq.requestBody.timeMin, fbReq.requestBody.timeMax)) {
        // naïve suggestion: push to end of the last busy block overlapping; keep same duration
        const sorted = busy
          .map(b => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }))
          .sort((a, b) => a.start - b.start);

        const desiredStart = new Date(fbReq.requestBody.timeMin).getTime();
        const desiredEnd = new Date(fbReq.requestBody.timeMax).getTime();
        const durationMs = desiredEnd - desiredStart;

        // find last conflict end >= desiredStart
        const lastOverlapEnd = sorted.reduce((acc, b) => (b.end >= desiredStart ? Math.max(acc, b.end) : acc), 0);
        const suggestedStart = new Date(Math.max(lastOverlapEnd, desiredStart));
        const suggestedEnd = new Date(suggestedStart.getTime() + durationMs);

        return res.status(409).json({
          error: "Time slot conflicts with existing events.",
          busy,
          suggested: {
            start: suggestedStart.toISOString().slice(0, 19),
            end: suggestedEnd.toISOString().slice(0, 19),
          },
        });
      }
    }

    // --- Insert event ---
    const event = {
      summary: title,
      description: description || "",
      location: location || undefined,
      start: { dateTime: start, timeZone: timezone || "UTC" },
      end:   { dateTime: end,   timeZone: timezone || "UTC" },
      attendees: Array.isArray(attendees) && attendees.length
        ? attendees.map(email => ({ email }))
        : undefined,
      reminders: { useDefault: true },
    };

    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return res.status(200).json({ id: data.id, htmlLink: data.htmlLink, status: data.status });
  } catch (err) {
    console.error("Calendar create error:", {
      message: err?.message,
      code: err?.code,
      response: err?.response?.data,
    });
    return res.status(500).json({
      error: err?.response?.data?.error?.message || err?.message || "Failed to create event",
    });
  }
}
