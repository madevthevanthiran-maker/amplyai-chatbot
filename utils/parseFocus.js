/**
 * Permanent, dependency-light natural-language time parser for AmplyAI.
 * Compatible signature:
 *   parseFocus(input, opts?) -> { title, startISO, endISO, allDay, timezone, notes }
 *
 * Handles:
 *  - "today 2pm", "tomorrow 14:30", "next Mon 9-11", "Fri 7pm-9pm"
 *  - "on 12/10 3pm", "25-12 10:00", "2025-09-20 13:00"
 *  - "from 3 to 5pm", "2-4pm", "noon", "midnight"
 *  - "all day tomorrow", "for 30 min", "block 2 hours at 4pm next tue"
 *  - defaults to Asia/Singapore
 * Never throws; returns { error } if cannot parse.
 */

const SG_TZ = "Asia/Singapore";

const WEEKDAYS = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

function toLocalDate(date, tz) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
  const y = +parts.year, m = +parts.month, d = +parts.day, hh = +(parts.hour || '00'), mm = +(parts.minute || '00');
  return { y, m, d, hh, mm };
}

function fromLocalParts(parts, tz) {
  const { y, m, d, hh = 0, mm = 0 } = parts;
  const guessUTC = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  // compute tz offset delta at that instant
  const wall = toLocalDate(guessUTC, tz);
  const diffMin = ((wall.hh - hh) * 60) + (wall.mm - mm);
  return new Date(guessUTC.getTime() - diffMin * 60000);
}

function startOfDay(date, tz) {
  const { y, m, d } = toLocalDate(date, tz);
  return fromLocalParts({ y, m, d, hh: 0, mm: 0 }, tz);
}
function addMinutes(date, mins) { return new Date(date.getTime() + mins * 60000); }
function addDays(date, days) { return new Date(date.getTime() + days * 86400000); }

function nextWeekday(from, targetDow, tz) {
  const base = fromLocalParts(toLocalDate(from, tz), tz);
  const dow = base.getDay();
  let delta = (targetDow - dow + 7) % 7;
  if (delta === 0) delta = 7;
  return addDays(base, delta);
}
function sameOrNextWeekday(from, targetDow, tz) {
  const base = fromLocalParts(toLocalDate(from, tz), tz);
  const dow = base.getDay();
  const delta = (targetDow - dow + 7) % 7;
  return addDays(base, delta);
}

function parseClock(str) {
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
  if (!ampm && hh === 24) hh = 0;
  if (hh > 23 || mm > 59) return null;
  return { hh, mm };
}

function parseDateToken(tok, now, tz) {
  const s = tok.trim().toLowerCase();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };

  m = s.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/);
  if (m) {
    const d = +m[1], mon = +m[2];
    const y = m[3] ? +(m[3].length === 2 ? (2000 + +m[3]) : +m[3]) : toLocalDate(now, tz).y;
    return { y, m: mon, d };
  }

  const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12 };
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
  const wd = Object.keys(WEEKDAYS).find(k => new RegExp(`\\b(next|this)?\\s*${k}\\b`).test(s));
  if (wd) {
    const target = WEEKDAYS[wd];
    if (/\bnext\b/.test(s)) return nextWeekday(now, target, tz);
    return sameOrNextWeekday(now, target, tz);
  }
  const dateTok = s.match(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|\d{1,2}\s+[a-z]{3,}|[a-z]{3,}\s+\d{1,2})\b/);
  if (dateTok) {
    const parts = parseDateToken(dateTok[1], now, tz);
    if (parts) return fromLocalParts({ ...parts, hh:0, mm:0 }, tz);
  }
  return null;
}

function parseDuration(text) {
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
  let title = text;

  const allDay = /\ball\s*day\b/i.test(text);
  let dateBase = parseRelativeDate(text, now, tz) || startOfDay(now, tz);

  const dateTokenMatch = text.match(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?|\b(?:today|tomorrow|tmr|yesterday)\b|\b(?:next|this)?\s*(?:sun|sunday|mon|monday|tue|tues|tuesday|wed|wednesday|thu|thurs|thursday|fri|friday|sat|saturday)\b)\b/i);

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
      if (end <= start) end = addDays(end, 1);
      title = title.replace(m[0], '').trim();
    }
  } else if (timeSingleMatch) {
    const t = parseClock(`${timeSingleMatch[2]} ${timeSingleMatch[3]||''}`.trim());
    if (t) {
      start = fromLocalParts({ ...toLocalDate(dateBase, tz), hh: t.hh, mm: t.mm }, tz);
      const tm = durMin != null ? durMin : 60;
      end = addMinutes(start, tm);
      title = title.replace(timeSingleMatch[0], '').trim();
    }
  } else if (allDay) {
    start = startOfDay(dateBase, tz);
    end = addDays(start, 1);
  }

  if (dateTokenMatch) title = title.replace(dateTokenMatch[0], '').trim();

  title = title
    .replace(/\b(on|at|from|to|this|next|today|tomorrow|tmr|yesterday|\d{1,2}[\/:]\d{1,2}(?:\s*(?:am|pm))?|\d{4}-\d{2}-\d{2}|all\s*day)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!title) title = 'Block Time';

  if (!start) {
    const nowLocal = toLocalDate(now, tz);
    let base = fromLocalParts({ y: nowLocal.y, m: nowLocal.m, d: nowLocal.d, hh: nowLocal.hh, mm: nowLocal.mm }, tz);
    const mins = base.getMinutes();
    const bump = mins <= 30 ? (30 - mins) : (60 - mins);
    start = addMinutes(base, bump);
    end = addMinutes(start, durMin != null ? durMin : (allDay ? 24*60 : 60));
  }

  return { title, startISO: start.toISOString(), endISO: end.toISOString(), allDay: !!allDay, timezone: tz, notes: null };
}

export default parseFocus;
