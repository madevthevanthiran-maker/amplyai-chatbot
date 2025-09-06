// /pages/api/google/calendar/create.js

import {
  ensureFreshTokens,
  readTokensFromReq,
  clientWithTokens,
  getAuthUrl,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Ensure we have tokens (and refresh if needed)
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);

    if (!tokens) {
      // Not connected → tell the client where to start OAuth
      return res.status(401).json({
        error: "Google not connected",
        authUrl: getAuthUrl("/settings"), // or wherever you want to return after connect
      });
    }

    const { title, description, start, end, timezone, location, attendees } =
      req.body || {};

    if (!title || !start || !end) {
      return res.status(400).json({
        error: "Missing required fields: title, start, end",
      });
    }

    const calendar = clientWithTokens(tokens);

    const event = {
      summary: title,
      description: description || "",
      location: location || undefined,
      start: {
        dateTime: start, // ISO string, e.g. "2025-09-07T10:00:00"
        timeZone: timezone || "UTC",
      },
      end: {
        dateTime: end, // ISO string
        timeZone: timezone || "UTC",
      },
      attendees:
        Array.isArray(attendees) && attendees.length
          ? attendees.map((email) => ({ email }))
          : undefined,
      reminders: {
        useDefault: true,
      },
    };

    const { data } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return res.status(200).json({
      id: data.id,
      htmlLink: data.htmlLink,
      status: data.status,
    });
  } catch (err) {
    console.error("Calendar create error:", err?.response?.data || err);
    return res.status(500).json({ error: "Failed to create event" });
  }
}
