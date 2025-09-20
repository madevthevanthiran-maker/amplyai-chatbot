// /utils/parseFocus.js
//
// Lightweight NL parser for focus/calendar prompts.
// Handles:
//  - "block 2-4pm tomorrow — Deep Work thesis"
//  - "next wed 14:30 call with supplier"
//  - "this fri 7pm-9pm dinner with family"
//  - "all day tomorrow: study retreat"
//  - "meeting on 12/10 9am for 2 hours"
//  - "range 13:00-15:30 today Project X"
// Timezone: optional tz string (IANA). If omitted, uses browser/server TZ.

const WEEKDAYS = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thur: 4, thurs: 4, fri: 5, sat: 6,
};

function clone(d){ return new Date(d.getTime()); }
function atStartOfDay(d){ const x = clone(d); x.setHours(0,0,0,0); return x; }
function atEndOfDay(d){ const x = clone(d); x.setHours(23,59,0,0); return x; }

function addDays(d, n){ const x = clone(d); x.setDate(x.getDate()+n); return x; }
function nextWeekday(d, weekday){ // > today
  const x = clone(d);
  const delta = (7 + weekday - x.getDay()) % 7 || 7;
  return addDays(x, delta);
}
function thisWeekday(d, weekday){ // can be today or later this week
  const x = clone(d);
  const delta = (7 + weekday - x.getDay()) % 7;
  return addDays(x, delta);
}

function parseTimePiece(h, m, ap) {
  let hour = parseInt(h,10);
  let minute = m ? parseInt(m,10) : 0;

  const hasAP = !!ap;
  if (hasAP) {
    ap = ap.toLowerCase();
    if (ap === "pm" && hour !== 12) hour += 12;
    if (ap === "am" && hour === 12) hour = 0;
  }
  // 24h like 14:30 -> leave as-is
  return { hour, minute, hasAP };
}

function inferAP(first, second){ // if only one side has am/pm, copy across
  if (first.hasAP && !second.hasAP) {
    // map into same half of day
    const s = { ...second };
    const guess = first.hour >= 12 ? "pm" : "am";
    return parseTimePiece(second.hour, second.minute, guess);
  }
  if (!first.hasAP && second.hasAP) {
    const f = { ...first };
    const guess = second.hour >= 12 ? "pm" : "am";
    return parseTimePiece(first.hour, first.minute, guess);
  }
  return null; // nothing to do
}

function toISOInTZ(dateObj, tz) {
  // Force a wall-clock time in an IANA tz to ISO (UTC) accurately.
  // Create the time parts using the tz, then convert to UTC ISO.
  if (!tz) return new Date(dateObj).toISOString();

  // Build components in that tz using Intl
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(dateObj).map(p => [p.type, p.value]));
  // Compose as if it's local in tz, then create a Date from that string with 'Z' removed,
  // and manually compute the UTC time using the tz offset at that instant.
  // Simpler: create Date from pieces in tz via Date.UTC then adjust by tz offset.

  const y = parseInt(parts.year,10);
  const M = parseInt(parts.month,10)-1;
  const d = parseInt(parts.day,10);
  const h = parseInt(parts.hour,10);
  const m = parseInt(parts.minute,10);
  const s = parseInt(parts.second,10);

  // Make a date first in the target tz by trick: get offset difference
  const local = new Date(Date.UTC(y, M, d, h, m, s));
  // Find what offset the target tz would have at that instant
  const tzOffsetMin = -Math.round(
    (new Date(local.toLocaleString('en-US', { timeZone: tz })).getTime() - local.getTime()) / 60000
  );
  const utc = new Date(local.getTime() - tzOffsetMin * 60000);
  return utc.toISOString();
}

function normalizeText(s) {
  // collapse unicode dashes to simple hyphen and strip multiple whitespace
  return s
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTitle(text) {
  // support " — " / " - " and ":" to separate title
  const m = text.match(/\s[-:]\s(.+)$/);
  if (m) {
    return { core: text.slice(0, m.index).trim(), title: m[1].trim() };
  }
  // also support "title after emdash anywhere"
  const dash = text.indexOf(" - ");
  if (dash > -1) {
    return { core: text.slice(0, dash).trim(), title: text.slice(dash + 3).trim() };
  }
  // fallback: no explicit title separator
  return { core: text, title: null };
}

function parseRelativeDate(core, now) {
  const lc = core.toLowerCase();

  // tomorrow / today
  if (/\btomorrow\b/.test(lc)) return { date: addDays(now, 1), consumed: "tomorrow" };
  if (/\btoday\b/.test(lc)) return { date: now, consumed: "today" };

  // this <weekday> / next <weekday>
  const nextWd = lc.match(/\bnext\s+([a-z]{3,9})\b/);
  if (nextWd && WEEKDAYS[nextWd[1]]) {
    return { date: nextWeekday(now, WEEKDAYS[nextWd[1]]), consumed: nextWd[0] };
  }
  const thisWd = lc.match(/\bthis\s+([a-z]{3,9})\b/);
  if (thisWd && WEEKDAYS[thisWd[1]]) {
    return { date: thisWeekday(now, WEEKDAYS[thisWd[1]]), consumed: thisWd[0] };
  }

  // explicit dd/mm or mm/dd (ambiguous) -> treat as dd/mm if day > 12, else mm/dd
  const dmy = lc.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (dmy) {
    const a = parseInt(dmy[1],10);
    const b = parseInt(dmy[2],10);
    let y = dmy[3] ? parseInt(dmy[3],10) : now.getFullYear();
    if (y < 100) y += 2000;

    let day, mon;
    if (a > 12) { day = a; mon = b; }
    else if (b > 12) { day = b; mon = a; }
    else { // ambiguous -> prefer day/month for most non-US users
      day = a; mon = b;
    }
    const dt = new Date(now);
    dt.setHours(0,0,0,0);
    dt.setMonth(mon-1, day);
    dt.setFullYear(y);
    return { date: dt, consumed: dmy[0] };
  }

  return null;
}

function extractTimeRange(core) {
  // 2-4pm, 2pm-4pm, 14:30-16:00, 7-9
  const re = /(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const m = core.match(re);
  if (!m) return null;

  const t1 = parseTimePiece(m[1], m[2], m[3]);
  let t2 = parseTimePiece(m[4], m[5], m[6]);

  // infer am/pm if missing on one side
  const inferredLeft = inferAP(t1, t2);
  if (inferredLeft) t2 = inferredLeft;

  return {
    start: { h: t1.hour, m: t1.minute },
    end:   { h: t2.hour, m: t2.minute },
    consumed: m[0],
  };
}

function extractSingleTime(core) {
  // 14:30, 2pm, 9:05am
  const re = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const m = core.match(re);
  if (!m) return null;
  const t = parseTimePiece(m[1], m[2], m[3]);
  return { h: t.hour, m: t.minute, consumed: m[0] };
}

function durationFromText(core) {
  // "for 2 hours", "for 90 minutes"
  const h = core.match(/\bfor\s+(\d+(?:\.\d+)?)\s*hours?\b/i);
  if (h) return Math.round(parseFloat(h[1]) * 60);
  const mm = core.match(/\bfor\s+(\d+)\s*min(?:utes)?\b/i);
  if (mm) return parseInt(mm[1],10);
  return null;
}

function detectAllDay(core){
  return /\b(all\s*day|allday|whole\s*day)\b/i.test(core);
}

export function parseFocus(input, now = new Date(), tz = null) {
  if (!input || typeof input !== "string") {
    return { ok: false, message: "Empty prompt." };
  }

  const original = input.trim();
  let text = normalizeText(original);

  // Peel title off the end if separated by dash/colon
  const split = splitTitle(text);
  let core = split.core;
  let title = split.title;

  // Remove leading verbs like "block", "meeting", "call", "range"
  core = core.replace(/^\b(block|meeting|meet|call|range|schedule|create)\b\s*/i, "");

  // Figure the date
  const rel = parseRelativeDate(core, now) || { date: now, consumed: null };
  let day = atStartOfDay(rel.date);
  if (rel.consumed) core = core.replace(rel.consumed, "").trim();

  // All-day?
  const isAllDay = detectAllDay(core);
  if (isAllDay) {
    core = core.replace(/\b(all\s*day|allday|whole\s*day)\b/i, "").trim();
  }

  // Time info
  let start = null, end = null, consumed = "";

  const range = extractTimeRange(core);
  if (range) {
    consumed = range.consumed;
    start = range.start;
    end   = range.end;
  } else {
    const single = extractSingleTime(core);
    if (single) {
      consumed = single.consumed;
      start = { h: single.h, m: single.m };
      // duration?
      const mins = durationFromText(core);
      if (mins) {
        end = { h: start.h, m: start.m + mins };
        if (end.m >= 60) { end.h += Math.floor(end.m/60); end.m %= 60; }
      } else {
        // default 60 minutes
        end = { h: start.h, m: start.m + 60 };
        if (end.m >= 60) { end.h += Math.floor(end.m/60); end.m %= 60; }
      }
    }
  }
  if (consumed) core = core.replace(consumed, "").trim();
  // Remove trailing fillers like "tomorrow", "today" that might still linger
  core = core.replace(/\b(today|tomorrow|this\s+[a-z]+|next\s+[a-z]+)\b/gi, "").trim();
  core = core.replace(/\bfor\s+\d+(\.\d+)?\s*(hours?|minutes?)\b/gi, "").trim();

  // Title fallback
  if (!title || !title.length) {
    // Whatever remains is title-ish
    title = core.length ? core : "Calendar block";
  }

  // Compose Date objects
  let startDate, endDate;

  if (isAllDay) {
    startDate = atStartOfDay(day);
    endDate = atEndOfDay(day);
  } else if (start && end) {
    startDate = clone(day); startDate.setHours(start.h, start.m, 0, 0);
    endDate   = clone(day); endDate.setHours(end.h, end.m, 0, 0);
    // If the end wrapped past midnight, push to next day
    if (endDate <= startDate) endDate = addDays(endDate, 1);
  } else if (start) {
    startDate = clone(day); startDate.setHours(start.h, start.m, 0, 0);
    endDate   = clone(startDate); endDate.setMinutes(endDate.getMinutes() + 60);
  } else {
    // No time parsed -> not enough info
    return { ok: false, message: "Couldn't parse into a date/time. Try being more specific." };
  }

  // Convert to ISO in TZ if provided
  const startISO = toISOInTZ(startDate, tz);
  const endISO   = toISOInTZ(endDate, tz);

  return {
    ok: true,
    parsed: {
      title,
      startISO,
      endISO,
      timezone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      allDay: isAllDay,
    },
    debug: { original, coreAfter: core }
  };
}

export default parseFocus;
