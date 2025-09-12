import { google } from 'googleapis';
import { getOAuth2ClientWithTokens } from './googleAuth';

export async function createCalendarEvent(userTokens, { summary, description, startISO, endISO, timeZone = 'Asia/Singapore' }) {
  const { oauth2Client, tokens, refreshed } = await getOAuth2ClientWithTokens(userTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const event = {
    summary,
    description,
    start: { dateTime: startISO, timeZone },
    end:   { dateTime: endISO,   timeZone },
  };
  try {
    const res = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
    return { event: res.data, tokens, refreshed };
  } catch (err) {
    console.error('[calendar.create] error', err?.response?.data || err);
    return { error: true, message: err?.response?.data?.error?.message || err.message };
  }
}

export async function listUpcomingEvents(userTokens, { maxResults = 10, timeMinISO } = {}) {
  const { oauth2Client, tokens, refreshed } = await getOAuth2ClientWithTokens(userTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  try {
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMinISO || new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return { events: res.data.items || [], tokens, refreshed };
  } catch (err) {
    console.error('[calendar.list] error', err?.response?.data || err);
    return { error: true, message: err?.response?.data?.error?.message || err.message };
  }
}
