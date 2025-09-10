// /pages/api/google/calendar/create.js
import {
  ensureFreshTokens,
  readTokensFromReq,
  clientWithTokens,
  getAuthUrl,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);
    if (!tokens) {
      // Force a real, absolute auth URL so the client can redirect
      return res.status(401).json({ error: "Google not connected", authUrl: getAuthUrl(req, "/settings") });
    }

    const { title, description, start, end, timezone, location, attendees } = req.body || {};
    if (!title || !start || !end) {
      return res.status(400).json({ error: "Missing required fields: title, start, end" });
    }

    const calendar = clientWithTokens(req, tokens);
    const event = {
      summary: title,
      description: description || "",
      location: location || undefined,
      start: { dateTime: start, timeZone: timezone || "UTC" },
      end: { dateTime: end, timeZone: timezone || "UTC" },
      attendees: Array.isArray(attendees) ? attendees.map(e => ({ email: e })) : undefined,
      reminders: { useDefault: true },
    };

    const { data } = await calendar.events.insert({ calendarId: "primary", requestBody: event });
    res.status(200).json({ id: data.id, htmlLink: data.htmlLink, status: data.status });
  } catch (err) {
    // Return a clean diagnostic (NOT that raw “reading 'parse'” anymore)
    res.status(500).json({ error: err?.response?.data?.error?.message || err?.message || "Failed to create event" });
  }
}
