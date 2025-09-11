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
    // Ensure/refresh tokens
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);

    if (!tokens) {
      // Not connected → tell the client where to go
      return res.status(401).json({
        error: "Google not connected",
        authUrl: getAuthUrl("/settings"),
      });
    }

    const { title, description, start, end, timezone, location, attendees } = req.body || {};
    if (!title || !start || !end) {
      return res.status(400).json({
        error: "Missing required fields: title, start, end",
        received: { title, start, end },
      });
    }

    const calendar = clientWithTokens(tokens);

    const event = {
      summary: title,
      description: description || "",
      location: location || undefined,
      start: { dateTime: start, timeZone: timezone || "UTC" },
      end: { dateTime: end, timeZone: timezone || "UTC" },
      attendees:
        Array.isArray(attendees) && attendees.length
          ? attendees.map((email) => ({ email }))
          : undefined,
      reminders: { useDefault: true },
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
    console.error("Calendar create error:", {
      message: err?.message,
      code: err?.code,
      response: err?.response?.data,
    });

    return res.status(500).json({
      error:
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to create event",
    });
  }
}
