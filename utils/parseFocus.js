# /utils/parseFocus.js
/**
 * Permanent, dependency-light natural-language time parser for AmplyAI.
 *
 * Goals:
 * - Handle: "today 2pm", "tomorrow 14:30", "next Mon 9-11", "Fri 7pm-9pm",
 *   "on 12/10 3pm", "25-12 10:00", "2025-09-20 13:00", "from 3 to 5pm",
 *   "2-4pm", "noon", "midnight", "all day tomorrow", "for 30 min",
 *   "block 2 hours at 4pm next tue", "this evening 7pm".
 * - Default timezone: Asia/Singapore unless provided.
 * - Return ISO strings with timezone awareness and guardrails.
 * - Never throw: returns { error } and suggested fallback when unsure.
 *
 * Signature stays compatible: parseFocus(input, opts?) -> { title, startISO, endISO, allDay, timezone, notes }
 */

const SG_TZ = "Asia/Singapore";

// Weekday map
const WEEKDAYS = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

function pad(n) { return n.toString().padStart(2, '0'); }

function toLocalDate(date, tz) {
  // Create a Date adjusted to tz by using the offset at that time
  const iso = new Date(date.getTime() - date.getTimezoneOffset()*60000).toISOString();
  // Use Intl to format in tz and reconstruct components
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
  const y = parts.year, m = parts.month, d = parts.day, hh = parts.hour || '00', mm = parts.minute || '00';
  return { y: +y, m: +m, d: +d, hh: +hh, mm: +mm };
}

function fromLocalParts(parts, tz) {
  // Construct a Date as if in tz by aligning to that zone's wall time
  const { y, m, d, hh = 0, mm = 0 } = parts;
  // First, create a UTC date from provided components assuming local system timezone,
  // then shift to the target tz by comparing offsets at that instant.
  const naive = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  // Find the tz offset (in minutes) at that instant
  const tzOffsetMin = -new Date(naive.toLocaleString('en-US', { timeZone: tz })).getTimezoneOffset();
  const adjusted = new Date(naive.getTime() - tzOffsetMin * 60000);
  return adjusted;
}

function startOfDay(date, tz) {
  const { y, m, d } = toLocalDate(date, tz);
  return fromLocalParts({ y, m, d, hh: 0, mm: 0 }, tz);
}

function addMinutes(date, mins) { return new Date(date.getTime() + mins * 60000); }
function addDays(date, days) { return new Date(date.getTime() + days * 86400000); }

function nextWeekday(from, targetDow, tz) {
  const fromLocal = toLocalDate(from, tz);
  const base = fromLocalParts(fromLocal, tz);
  const dow = base.getDay();
  let delta = (targetDow - dow + 7) % 7;
  if (delta === 0) delta = 7; // "next" means the upcoming occurrence, not today
  return addDays(base, delta);
}

function sameOrNextWeekday(from, targetDow, tz) {
  const fromLocal = toLocalDate(from, tz);
  const base = fromLocalParts(fromLocal, tz);
  const dow = base.getDay();
  let delta = (targetDow - dow + 7) % 7;
  return addDays(base, delta);
}

function parseClock(str) {
  // Returns { hh, mm } in 24h, supports "2pm", "14:30", "2:15pm", "noon", "midnight"
  const s = str.trim().toLowerCase();
  if (s.includes('noon')) return { hh: 12, mm: 0 };
  if (s.includes('midnight')) return { hh: 0, mm: 0 };

  const m = s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3];
  if (ampm) {
    if (ampm === 'pm' && hh !== 12) hh += 12;
    if (ampm === 'am' && hh === 12) hh = 0;
  }
  if (!ampm && hh === 24) hh = 0; // 24:00 edge
  if (hh > 23 || mm > 59) return null;
  return { hh, mm };
}

function parseDateToken(tok, now, tz) {
  // dd/mm, dd-mm, yyyy-mm-dd, mm/dd, dd mon, mon dd
  const s = tok.trim().toLowerCase();
  // ISO
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    return { y: +m[1], m: +m[2], d: +m[3] };
  }
  // dd/mm or dd-mm
  m = s.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/);
  if (m) {
    const d = +m[1], mon = +m[2], y = m[3] ? +(m[3].length === 2 ? (2000 + +m[3]) : +m[3]) : toLocalDate(now, tz).y;
    return { y, m: mon, d };
  }
  // e.g., 25 Dec or Dec 25
  const MONTHS = {
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12
  };
  m = s.match(/^(\d{1,2})\s*([a-z]{3,})$/);
  if (m && MONTHS[m[2].slice(0,3)]) {
    const d = +m[1], mon = MONTHS[m[2].slice(0,3)];
    const y = toLocalDate(now, tz).y;
    return { y, m: mon, d };
  }
  m = s.match(/^([a-z]{3,})\s*(\d{1,2})$/);
  if (m && MONTHS[m[1].slice(0,3)]) {
    const d = +m[2], mon = MONTHS[m[1].slice(0,3)];
    const y = toLocalDate(now, tz).y;
    return { y, m: mon, d };
  }
  return null;
}

function parseRelativeDate(text, now, tz) {
  const s = text.toLowerCase();
  if (/(today)(?!\w)/.test(s)) return startOfDay(now, tz);
  if (/(tomorrow|tmr)(?!\w)/.test(s)) return startOfDay(addDays(now,1), tz);
  if (/(yesterday)(?!\w)/.test(s)) return startOfDay(addDays(now,-1), tz);
  // this/next weekday
  const wd = Object.keys(WEEKDAYS).find(k => new RegExp(`\b(next|this)?\s*${k}\b`).test(s));
  if (wd) {
    const target = WEEKDAYS[wd];
    if (/\bnext\b/.test(s)) return nextWeekday(now, target, tz);
    // If "this" or bare weekday: choose same-or-next
    return sameOrNextWeekday(now, target, tz);
  }
  // Date token inside text
  const dateTok = s.match(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|\d{1,2}\s+[a-z]{3,}|[a-z]{3,}\s+\d{1,2})\b/);
  if (dateTok) {
    const parts = parseDateToken(dateTok[1], now, tz);
    if (parts) return fromLocalParts({ ...parts, hh:0, mm:0 }, tz);
  }
  return null;
}

function parseDuration(text) {
  // returns minutes
  const s = text.toLowerCase();
  const m1 = s.match(/\bfor\s+(\d{1,3})\s*(min|mins|minutes)\b/);
  if (m1) return +m1[1];
  const m2 = s.match(/\bfor\s+(\d{1,2})\s*(h|hr|hrs|hour|hours)\b/);
  if (m2) return +m2[1] * 60;
  const m3 = s.match(/\b(\d{1,2})\s*(h|hr|hrs)\b/);
  if (m3) return +m3[1] * 60;
  const m4 = s.match(/\b(\d{1,3})\s*(min|mins)\b/);
  if (m4) return +m4[1];
  return null;
}

export function parseFocus(input, opts = {}) {
  const tz = opts.timezone || SG_TZ;
  const now = opts.now instanceof Date ? opts.now : new Date();
  const raw = String(input || '').trim();
  if (!raw) return { error: 'EMPTY_INPUT', message: 'No text to parse' };

  const text = raw.replace(/\s+/g, ' ').trim();

  // Extract title by removing known date/time phrases later; start with full string
  let title = text;

  // Detect all-day
  const allDay = /\ball\s*day\b/.test(text);

  // Parse anchor date
  let dateBase = parseRelativeDate(text, now, tz) || startOfDay(now, tz);

  // Extract explicit date token to refine title removal
  const dateTokenMatch = text.match(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|\b(?:today|tomorrow|tmr|yesterday)\b|\b(?:next|this)?\s*(?:sun|sunday|mon|monday|tue|tues|tuesday|wed|wednesday|thu|thurs|thursday|fri|friday|sat|saturday)\b)\b/i);

  // Time range patterns
  // e.g., 2-4pm, 2pm-4pm, from 3 to 5pm
  const range1 = text.match(/\b(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s*[-–]\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?\b/i);
  const range2 = text.match(/\bfrom\s+(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s+to\s+(\d{1,2}(?::\d{2})?)\s*(am|pm)?\b/i);

  const timeSingleMatch = text.match(/\b(at|@)?\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?\b/i);

  let start, end;

  const durMin = parseDuration(text);

  if (range1 || range2) {
    const m = range1 || range2;
    const t1 = parseClock(`${m[1]} ${m[2]||''}`.trim());
    const t2 = parseClock(`${m[3]} ${m[4]||''}`.trim());
    if (t1 && t2) {
      start = fromLocalParts({ ...toLocalDate(dateBase, tz), hh: t1.hh, mm: t1.mm }, tz);
      end = fromLocalParts({ ...toLocalDate(dateBase, tz), hh: t2.hh, mm: t2.mm }, tz);
      // if end before start (like 10pm-1am), roll to next day
      if (end <= start) end = addDays(end, 1);
      title = title.replace(m[0], '').trim();
    }
  } else if (timeSingleMatch) {
    const t = parseClock(`${timeSingleMatch[2]} ${timeSingleMatch[3]||''}`.trim());
    if (t) {
      start = fromLocalParts({ ...toLocalDate(dateBase, tz), hh: t.hh, mm: t.mm }, tz);
      const tm = durMin != null ? durMin : 60; // default 60 minutes if time specified
      end = addMinutes(start, tm);
      title = title.replace(timeSingleMatch[0], '').trim();
    }
  } else if (allDay) {
    start = startOfDay(dateBase, tz);
    end = addDays(start, 1);
  }

  if (dateTokenMatch) title = title.replace(dateTokenMatch[0], '').trim();

  // Clean filler words for title
  title = title.replace(/\b(on|at|from|to|this|next|today|tomorrow|tmr|yesterday|\d{1,2}[\/:]\d{1,2}(?:\s*(?:am|pm))?|\d{4}-\d{2}-\d{2}|all\s*day)\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!title) title = 'Block Time';

  // Finalize
  const tzInfo = tz;
  if (!start) {
    // If no time found, default to next half-hour slot today/tomorrow
    const nowLocal = toLocalDate(now, tz);
    let base = fromLocalParts({ y: nowLocal.y, m: nowLocal.m, d: nowLocal.d, hh: nowLocal.hh, mm: nowLocal.mm }, tz);
    // round up to next :00 or :30
    const mins = base.getMinutes();
    const bump = mins <= 30 ? (30 - mins) : (60 - mins);
    start = addMinutes(base, bump);
    end = addMinutes(start, durMin != null ? durMin : (allDay ? 24*60 : 60));
  }

  const startISO = start.toISOString();
  const endISO = end.toISOString();

  return { title, startISO, endISO, allDay: !!allDay, timezone: tzInfo, notes: null };
}

export default parseFocus;


# /lib/googleAuth.js (new)
import { google } from 'googleapis';

// Centralize OAuth2 client creation and token refreshing.
// Assumes you already store tokens per user (DB/session). You pass them in when calling getOAuth2Client.

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn('[googleAuth] Missing Google OAuth env vars.');
}

export function createOAuth2Client() {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

export async function getOAuth2ClientWithTokens(tokens) {
  const oauth2Client = createOAuth2Client();
  if (tokens) oauth2Client.setCredentials(tokens);

  // Proactively refresh if near expiry
  try {
    if (tokens && tokens.expiry_date && tokens.expiry_date - Date.now() < 2 * 60 * 1000) {
      const res = await oauth2Client.refreshAccessToken();
      const newTokens = res.credentials;
      oauth2Client.setCredentials(newTokens);
      return { oauth2Client, tokens: newTokens, refreshed: true };
    }
  } catch (e) {
    console.error('[googleAuth] refreshAccessToken failed', e?.response?.data || e?.message);
  }
  return { oauth2Client, tokens, refreshed: false };
}

export function getAuthUrl(scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
]) {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
}


# /lib/calendar.js (new)
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
    return { event: res.data, tokens: tokens, refreshed };
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


# /pages/api/google/parse-and-create.js (new)
import { createCalendarEvent } from '../../../lib/calendar';
import { parseFocus } from '../../../utils/parseFocus';

/**
 * POST /api/google/parse-and-create
 * Body: { text: string, tokens: { access_token, refresh_token, scope, token_type, expiry_date }, timezone? }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { text, tokens, timezone } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });
    if (!tokens) return res.status(401).json({ error: 'Not connected' });

    const parsed = parseFocus(text, { timezone });
    if (parsed.error) return res.status(400).json({ error: 'PARSE_ERROR', detail: parsed });

    const { title, startISO, endISO, allDay, timezone: tz } = parsed;
    const result = await createCalendarEvent(tokens, {
      summary: title,
      description: allDay ? 'All-day block (auto)' : 'Created by AmplyAI',
      startISO, endISO, timeZone: tz,
    });

    if (result.error) return res.status(500).json(result);
    return res.status(200).json({ ok: true, parsed, event: result.event, refreshed: result.refreshed, tokens: result.tokens });
  } catch (e) {
    console.error('[parse-and-create] fatal', e);
    return res.status(500).json({ error: 'INTERNAL', message: e.message });
  }
}


# /pages/api/google/create-event.js
import { createCalendarEvent } from '../../../lib/calendar';

/**
 * POST /api/google/create-event
 * Body: { summary, description, startISO, endISO, timeZone, tokens }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { summary, description, startISO, endISO, timeZone = 'Asia/Singapore', tokens } = req.body || {};
    if (!tokens) return res.status(401).json({ error: 'Not connected' });
    if (!summary || !startISO || !endISO) return res.status(400).json({ error: 'Missing fields' });

    const result = await createCalendarEvent(tokens, { summary, description, startISO, endISO, timeZone });
    if (result.error) return res.status(500).json(result);

    return res.status(200).json({ ok: true, event: result.event, refreshed: result.refreshed, tokens: result.tokens });
  } catch (e) {
    console.error('[create-event] fatal', e);
    return res.status(500).json({ error: 'INTERNAL', message: e.message });
  }
}


# /pages/api/google/list-events.js
import { listUpcomingEvents } from '../../../lib/calendar';

/**
 * GET /api/google/list-events?max=10
 * Body (optional): { tokens }
 * If you hold tokens server-side (e.g., session), adapt to fetch them there.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const max = parseInt(req.query.max || '10', 10);
    const tokens = req.method === 'GET' ? null : (req.body?.tokens || null);
    if (!tokens) return res.status(401).json({ error: 'Not connected' });

    const result = await listUpcomingEvents(tokens, { maxResults: max });
    if (result.error) return res.status(500).json(result);

    return res.status(200).json({ ok: true, events: result.events, refreshed: result.refreshed, tokens: result.tokens });
  } catch (e) {
    console.error('[list-events] fatal', e);
    return res.status(500).json({ error: 'INTERNAL', message: e.message });
  }
}


# /components/Settings/GoogleSection.jsx (new)
import { useState } from 'react';

export default function GoogleSection({ initialConnected = false, initialTokens = null, onTokens }) {
  const [connected, setConnected] = useState(initialConnected);
  const [tokens, setTokens] = useState(initialTokens);
  const [status, setStatus] = useState('');

  async function connect() {
    setStatus('Opening Google consent...');
    window.location.href = '/api/google/connect';
  }

  async function disconnect() {
    setTokens(null);
    setConnected(false);
    onTokens?.(null);
  }

  async function createSample() {
    try {
      setStatus('Creating sample event...');
      const now = new Date();
      const startISO = new Date(now.getTime() + 10*60*1000).toISOString();
      const endISO = new Date(now.getTime() + 70*60*1000).toISOString();
      const r = await fetch('/api/google/create-event', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: 'AmplyAI Sample Event',
          description: 'Created from Settings',
          startISO, endISO, timeZone: 'Asia/Singapore', tokens
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || 'Failed');
      setStatus('Sample event created ✅');
      if (data.tokens) { setTokens(data.tokens); onTokens?.(data.tokens); }
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-medium">Google Calendar</span>
        <span className={`text-xs px-2 py-0.5 rounded ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="flex gap-2">
        <button onClick={connect} className="px-3 py-1.5 rounded bg-black text-white">Connect</button>
        <button onClick={disconnect} className="px-3 py-1.5 rounded bg-gray-200">Disconnect</button>
        <button onClick={createSample} disabled={!tokens} className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50">Create sample event</button>
      </div>
      <div className="text-sm text-gray-600">{status}</div>
    </div>
  );
}


# /pages/api/google/connect.js (new)
import { getAuthUrl } from '../../../lib/googleAuth';

export default async function handler(req, res) {
  try {
    const url = getAuthUrl();
    return res.redirect(url);
  } catch (e) {
    console.error('[connect] error', e);
    res.status(500).json({ error: 'INTERNAL', message: e.message });
  }
}


# /pages/api/google/oauth-callback.js (new)
import { createOAuth2Client } from '../../../lib/googleAuth';

export default async function handler(req, res) {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing code');
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);

    // TODO: store tokens server-side associated with user/session.
    // For demo, serialize and pass to frontend (NOT for production).
    const b64 = Buffer.from(JSON.stringify(tokens)).toString('base64url');
    return res.redirect(`/settings?googleTokens=${b64}`);
  } catch (e) {
    console.error('[oauth-callback] error', e?.response?.data || e);
    res.status(500).send('OAuth failed. Check console/logs.');
  }
}
