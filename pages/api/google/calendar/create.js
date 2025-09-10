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
    // Try to refresh, else fallback to exist. If still none -> 401 with authUrl
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);
    if (!tokens) {
      return res.status(401).json({
        error: "Google not connected",
        authUrl: getAuthUrl("/settings"),
      });
    }

    const calendar = clientWithTokens(tokens);
    if (!calendar) {
      // Happens if refresh_token missing or invalid
      return res.status(401).json({
        error: "Google session expired",
        authUrl: getAuthUrl("/settings"),
      });
    }

    const {
      title,
      description,
      start, // "YYYY-MM-DDTHH:mm:ss" local wall time
      end,
      timezone, // IANA tz like "Australia/Melbourne"
      location,
      attendees,
    } = req.body || {};

    if (!title || !start || !end) {
      return res.status(400).json({
        error: "Missing required fields: title, start, end",
        received: { title, start, end },
      });
    }

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

    const resp = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return res.status(200).json({
      id: resp?.data?.id,
      htmlLink: resp?.data?.htmlLink,
      status: resp?.data?.status,
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
