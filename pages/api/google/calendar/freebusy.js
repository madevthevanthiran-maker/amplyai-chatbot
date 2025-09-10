// /pages/api/google/calendar/freebusy.js
import {
  ensureFreshTokens,
  readTokensFromReq,
  clientWithTokens,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Ensure tokens
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);
    if (!tokens) {
      return res.status(401).json({ error: "Google not connected" });
    }

    const { startISO, endISO, timezone } = req.body || {};
    if (!startISO || !endISO) {
      return res.status(400).json({ error: "Missing startISO or endISO" });
    }

    const calendar = clientWithTokens(tokens);

    // Use events.list to get expanded single events between timeMin/timeMax
    const { data } = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date(startISO).toISOString(),
      timeMax: new Date(endISO).toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      timeZone: timezone || "UTC",
      maxResults: 50,
    });

    const events = (data.items || []).map((e) => ({
      id: e.id,
      summary: e.summary || "(no title)",
      htmlLink: e.htmlLink,
      start: e.start?.dateTime || e.start?.date, // all-day events might have date only
      end: e.end?.dateTime || e.end?.date,
    }));

    // Simple overlap check
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    const overlaps = events.filter((ev) => {
      const s = new Date(ev.start).getTime();
      const e = new Date(ev.end).getTime();
      return Math.max(start, s) < Math.min(end, e);
    });

    return res.status(200).json({ conflicts: overlaps });
  } catch (err) {
    console.error("freebusy error:", {
      message: err?.message,
      code: err?.code,
      response: err?.response?.data,
    });
    return res.status(500).json({
      error:
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to check conflicts",
    });
  }
}
