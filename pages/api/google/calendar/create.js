// /pages/api/google/calendar/create.js
import {
  ensureFreshTokens,
  readTokensFromReq,
  calendarClient,
  getAuthUrl,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Try to obtain/refresh tokens
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);

    if (!tokens) {
      // Not connected → always respond JSON with authUrl
      return res
        .status(401)
        .json({ error: "Not connected", authUrl: getAuthUrl("/settings") });
    }

    const { title, description, start, end, timezone, location, attendees } =
      req.body || {};

    if (!title || !start || !end) {
      return res.status(400).json({
        error: "Missing required fields: title, start, end",
        received: { title, start, end },
      });
    }

    const calendar = calendarClient(tokens);

    const event = {
      summary: title,
      description: description || "",
      location: location || undefined,
      start: { dateTime: start, timeZone: timezone || "UTC" },
      end:   { dateTime: end,   timeZone: timezone || "UTC" },
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

    const gError = err?.response?.data?.error;
    if (gError?.status === "PERMISSION_DENIED") {
      return res.status(403).json({
        error:
          "Request had insufficient authentication scopes. Disconnect and re-connect to approve the latest scopes.",
      });
    }

    return res.status(500).json({
      error:
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to create event",
    });
  }
}
