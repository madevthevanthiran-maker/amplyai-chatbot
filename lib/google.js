// lib/google.js
import { google } from "googleapis";
import { getOAuth2ClientWithTokens } from "./googleAuth";

export async function insertEvent({ tokens, title, startISO, endISO, timezone }) {
  const { oauth2Client, refreshed, tokens: newTokens } = await getOAuth2ClientWithTokens(tokens);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: title,
    start: { dateTime: startISO, timeZone: timezone },
    end: { dateTime: endISO, timeZone: timezone },
  };

  try {
    const res = await calendar.events.insert({ calendarId: "primary", requestBody: event });
    return { success: true, event: res.data, tokens: newTokens, refreshed };
  } catch (err) {
    console.error("insertEvent error", err?.response?.data || err?.message);
    return { success: false, error: err?.response?.data || err?.message };
  }
}
