// pages/api/google/calendar/parse-create.js

import { getOAuth2ClientWithTokens } from "@/lib/googleAuth";
import { readGoogleTokens } from "@/lib/googleCookie";
import { google } from "googleapis";
import parseFocus from "@/utils/parseFocus";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid text" });
  }

  const tokens = readGoogleTokens(req);
  if (!tokens) {
    return res.status(401).json({ error: "Missing Google auth tokens" });
  }

  const { oauth2Client, refreshed, tokens: newTokens } = await getOAuth2ClientWithTokens(tokens);

  const parsed = parseFocus(text);
  if (!parsed?.startISO || !parsed?.endISO) {
    return res.status(400).json({ error: "Unable to parse time" });
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const event = {
      summary: parsed.title,
      description: `Created from chat: "${parsed.text}"`,
      start: { dateTime: parsed.startISO, timeZone: parsed.timezone },
      end: { dateTime: parsed.endISO, timeZone: parsed.timezone },
    };

    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    const eventLink = created.data.htmlLink;
    if (refreshed && newTokens?.access_token) {
      res.setHeader("Set-Cookie", [
        `gauth=${encodeURIComponent(JSON.stringify(newTokens))}; Path=/; Max-Age=2592000; SameSite=Lax`,
      ]);
    }

    return res.status(200).json({
      success: true,
      eventLink,
      parsed,
    });
  } catch (err) {
    console.error("Calendar insert failed", err?.response?.data || err.message);
    return res.status(500).json({ error: "Failed to create calendar event" });
  }
}
