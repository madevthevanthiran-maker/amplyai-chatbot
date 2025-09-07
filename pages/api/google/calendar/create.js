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
      // Not connected → let client redirect
      return res.status(401).json({
        error: "Google not connected",
        authUrl: getAuthUrl("/settings"),
      });
    }

    const { title, description, start, end, timezone, location, attendees } =
      req.body || {};

    // Validate inputs early and explicitly
    if (!title || !start || !end) {
      return res.status(400).json({
        error: "Missing required fields: title, start, end",
        received: { title, start, end },
      });
    }

    // Build Calendar client and event
    const calendar = clientWithTokens(tokens);
    const event = {
      summary: title,
      description: description || "",
      location: location || undefined,
      start: {
        dateTime: start, // "YYYY-MM-DDTHH:mm:ss"
        timeZone: timezone || "UTC",
      },
      end: {
        dateTime: end,
        timeZone: timezone || "UTC",
      },
      attendees:
        Array.isArray(attendees) && attendees.length
          ? attendees.map((email) => ({ email }))
          : undefined,
      reminders: { useDefault: true },
    };

    // Insert event
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
    // Log for Vercel
    console.error("Calendar create error:", {
      message: err?.message,
      code: err?.code,
      response: err?.response?.data,
    });

    // Return diagnostic info to the client (safe subset)
    return res.status(500).json({
      error: err?.response?.data?.error?.message ||
             err?.message ||
             "Failed to create event",
    });
  }
}
