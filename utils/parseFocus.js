/**
 * Permanent, dependency-light natural-language time parser for AmplyAI.
 * -------------------------------------------------------------------
 * Goals:
 *  - Handle common chatty phrases for meetings & blocks
 *  - Be timezone-aware without external libs
 *  - Prefer “next/this <weekday>” + “in Xm/h” + ranges like “7p–9p”
 *  - Understand durations like “for 45m / for 2 hours”
 *  - Recognize all-day events (“all day …”)
 *  - Work with compact titles like “— Focus sprint” / “: standup”
 *
 * Input examples (all supported):
 *  - "block 2-4pm tomorrow — Deep Work thesis"
 *  - "next wed 14:30 call with supplier"
 *  - "all day tomorrow: study retreat"
 *  - "this fri 7pm-9pm dinner with family"
 *  - "meeting on 12/10 9am for 2 hours"
 *  - "in 30m for 45m project sync"
 *  - "every Mon 9–10"  (RRULE not emitted here; still parses first occurrence)
 *
 * Output shape:
 *  {
 *    title: string,
 *    startISO: string,   // ISO 8601 in user's tz
 *    endISO: string,
 *    timezone: string,   // e.g. "Asia/Singapore"
 *    allDay?: boolean,
 *    durationMin?: number,
 *    notes?: string      // trailing text we stripped from title
 *  }
 *
 * NOTE: Keep this file dependency-free and deterministic. No network.
 */

const TZ =
  typeof Intl !== "undefined" &&
  Intl.DateTimeFormat().resolvedOptions().timeZone
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

/** ---------- Utilities ---------- */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISOInTZ(date, tz = TZ) {
  // Convert a Date that represents wall-clock in tz to ISO string with that instant in UTC.
  // Here, we assume `date` is already a Date in local time; to format as tz, we compute the same wall-clock in tz and return a real ISO.
  // Strategy: build a Date from its components interpreted in tz using Date.UTC on those, then shift by tz offset.
  // Simpler: use Intl to get parts; then create a UTC timestamp from those parts (approx). Since JS lacks tz math without libs,
  // we use a trick: get the tz local parts, then create a Date from them as if they were local, then correct offset by formatting again.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
  // mm/dd/yyyy, HH:MM:SS from parts
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  const hh = Number(parts.hour);
  const mm = Number(parts.minute);
  const ss = Number(parts.second);
  // Construct a UTC time for those tz-wall-clock parts by asking for the instant represented in tz.
  // To get the real instant, create a Date for that wall clock in tz by using Date.UTC and then subtract the tz offset at that instant.
  // But we can't get tz offset directly for arbitrary tz. Workaround:
  // Create a date from string with TZ annotation via toLocaleString w/ timeZone then parse? Not reliable.
  // Practical approach: Create a Date from 'YYYY-MM-DDTHH:mm:ss' as if in tz by using the target tz’s offset at that moment
  // using the Date for the naive local time and compute diff with formatToParts for UTC.
  const naive = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
  // The naive represents that wall-clock in UTC; to get the actual instant, shift by tz offset at that instant:
  // We can derive the offset by comparing formatted time in tz vs UTC for the same naive instant.
  const tzOffsetMinutes = getTZOffsetMinutes(naive, tz);
  const real = new Date(naive.getTime() - tzOffsetMinutes * 60_000);
  return real.toISOString();
}

function getTZOffsetMinutes(date, tz) {
  // Find offset between UTC and tz at given instant.
  // Format in tz and in UTC, compare their epoch milliseconds by reconstructing from parts.
  const inTZ = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(date)
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
  const tzEpoch = Date.UTC(
    Number(inTZ.year),
    Number(inTZ.month) - 1,
    Number(inTZ.day),
    Number(inTZ.hour),
    Number(inTZ.minute),
    Number(inTZ.second)
  );
  // The same `date` instant has getTime() in UTC epoch ms.
  // Offset (minutes) = (tzEpoch - dateEpoch)/60000
  return Math.round((tzEpoch - date.getTime()) / 60000);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMinutes(date, n) {
  return new Date(date.getTime() + n * 60_000);
}

function parseIntSafe(s, def = 0) {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : def;
}

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
function nextWeekday(base, targetIdx, inclusive = false) {
  const b = new Date(base);
  const cur = b.getDay();
  let delta = targetIdx - cur;
  if (delta <= 0) delta += 7;
  if (inclusive && delta === 0) delta = 0;
  return addDays(b, delta);
}
function thisOrNextWeekday(base, targetIdx) {
  const b = new Date(base);
  const cur = b.getDay();
  if (cur === targetIdx) return b;
  // next occurrence this week; if already passed this week, next week
  let delta = targetIdx - cur;
  if (delta < 0) delta += 7;
  return addDays(b, delta);
}

function normalizeDashes(text) {
  return text.replace(/[–—]/g, "-");
}

function trimPunctuation(s) {
  return s.replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, "");
}

/** ---------- Core parsing ---------- */

export default function parseFocus(input, now = new Date(), displayTZ = TZ) {
  if (!input || typeof input !== "string") return null;

  // Normalize whitespace and punctuation
  let raw = input.trim().replace(/\s+/g, " ");
  raw = normalizeDashes(raw);

  // Extract obvious "all day"
  const allDayHint = /\ball\s*day\b/i.test(raw);

  // Separate title using common separators ("—", "-", ":", "–")
  let title = "";
  let timePart = raw;
  const sepMatch = raw.match(/\s(?:—|-|:)\s/);
  if (sepMatch) {
    const idx = raw.indexOf(sepMatch[0]);
    timePart = raw.slice(0, idx).trim();
    title = raw.slice(idx + sepMatch[0].length).trim();
  } else {
    // If no explicit separator, try to find trailing title after time words
    // e.g., "next wed 14:30 call with supplier"
    // Strategy: parse time first; leftover tokens become title.
  }

  // Pull out "for X hours/minutes" duration (won't remove ranges)
  let durationMin = null;
  const durRe =
    /\bfor\s+(\d{1,3})(?:\s?(mins?|minutes?|hrs?|hours?))\b|\bfor\s+(\d{1,2})\s?h(?::?(\d{2}))?\b/i;
  const durM = raw.match(durRe);
  if (durM) {
    if (durM[1]) {
      const n = parseIntSafe(durM[1], 0);
      const unit = (durM[2] || "").toLowerCase();
      durationMin =
        unit.startsWith("h") ? clamp(n, 0, 48) * 60 : clamp(n, 0, 6000);
    } else {
      // "for 1h" or "for 1h30"
      const h = clamp(parseIntSafe(durM[3], 0), 0, 48);
      const mm = clamp(parseIntSafe(durM[4], 0), 0, 59);
      durationMin = h * 60 + mm;
    }
    // Remove duration from text pieces so it doesn't interfere with time parsing
    raw = raw.replace(durRe, "").replace(/\s{2,}/g, " ").trim();
    timePart = timePart.replace(durRe, "").replace(/\s{2,}/g, " ").trim();
  }

  // Relative "in 30m / in 2h / in 1 hour 30 min"
  const relRe =
    /\bin\s+(\d{1,3})(?:\s?(mins?|minutes?|m|hrs?|hours?|h))?(?:\s*(\d{1,2})\s?(mins?|minutes?|m))?\b/i;
  const relM = raw.match(relRe);

  // Day words: today / tomorrow / next/this <weekday>
  let baseDate = new Date(now);
  let explicitDayUsed = false;

  // "today" / "tomorrow"
  if (/\btoday\b/i.test(raw)) {
    explicitDayUsed = true;
  } else if (/\btomorrow\b/i.test(raw)) {
    baseDate = addDays(baseDate, 1);
    explicitDayUsed = true;
  }

  // "next fri", "this wed"
  const wdM = raw.match(/\b(next|this)\s+(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/i);
  if (wdM) {
    const when = wdM[1].toLowerCase();
    const wdStr = wdM[2].slice(0, 3).toLowerCase().replace("tue", "tue").replace("thu", "thu");
    const idx = WEEKDAYS.indexOf(wdStr);
    if (idx >= 0) {
      baseDate = when === "next" ? nextWeekday(baseDate, idx) : thisOrNextWeekday(baseDate, idx);
      explicitDayUsed = true;
    }
  }

  // "on 12/10", "on 2025-12-10", "12/10", "10-12-2025"
  const dateM = raw.match(
    /\b(?:on\s+)?((\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?)\b/i
  );
  if (dateM) {
    let Y, M, D;
    if (dateM[2]) {
      // YYYY-MM-DD
      Y = parseIntSafe(dateM[2]);
      M = clamp(parseIntSafe(dateM[3]), 1, 12);
      D = clamp(parseIntSafe(dateM[4]), 1, 31);
    } else {
      // MM/DD[/YYYY] or DD-MM-YYYY (we default to MM/DD when using "/" and to DD-MM when using "-" and 3 parts)
      const a = [dateM[5], dateM[6], dateM[7]].filter(Boolean).map((x) => parseIntSafe(x));
      if (a.length === 3 && dateM[0].includes("-")) {
        // Assume DD-MM-YYYY if separator is '-' and 3 parts
        D = clamp(a[0], 1, 31);
        M = clamp(a[1], 1, 12);
        Y = a[2] < 100 ? 2000 + a[2] : a[2];
      } else {
        // Assume MM/DD[/YYYY]
        M = clamp(a[0], 1, 12);
        D = clamp(a[1], 1, 31);
        Y = a[2] ? (a[2] < 100 ? 2000 + a[2] : a[2]) : baseDate.getFullYear();
      }
    }
    baseDate = new Date(baseDate);
    baseDate.setFullYear(Y, M - 1, D);
    explicitDayUsed = true;
  }

  // Time parsing
  // Accept: "14:30", "2:30pm", "2pm", "7p-9p", "7-9pm", "7pm-9pm"
  // Use the first time range or single time found in the **timePart** if it exists else raw.
  const searchText = timePart || raw;
  const timeRangeRe =
    /\b(\d{1,2})(?::?(\d{2}))?\s*(a|am|p|pm)?\s?[-–]\s?(\d{1,2})(?::?(\d{2}))?\s*(a|am|p|pm)?\b/i;
  const timeSingleRe = /\b(\d{1,2})(?::?(\d{2}))?\s*(a|am|p|pm)?\b/i;
  const hm24Re = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;

  let start = null;
  let end = null;

  const rangeM = searchText.match(timeRangeRe);
  if (rangeM) {
    const sH = parseIntSafe(rangeM[1]),
      sM = parseIntSafe(rangeM[2] || "0");
    const sMer = (rangeM[3] || "").toLowerCase(); // a/am/p/pm/empty

    const eH = parseIntSafe(rangeM[4]),
      eM = parseIntSafe(rangeM[5] || "0");
    let eMer = (rangeM[6] || "").toLowerCase();

    // If only one meridian is provided, carry it to the other side when it makes sense (e.g., "7-9pm")
    let s24 = to24h(sH, sMer);
    let e24 = to24h(eH, eMer || (sMer ? sMer : ""));

    // If still ambiguous (no meridians) and numbers small, assume same half-day and after start
    if (!sMer && !eMer && sH <= 12 && eH <= 12) {
      if (explicitDayUsed) {
        // assume daytime; if start < 8, bump to pm for human-ish defaults when evening-like range
        if (sH <= 7 && eH <= 9) {
          s24 = sH + 12;
          e24 = eH + 12;
        } else {
          s24 = sH;
          e24 = eH;
        }
      } else {
        s24 = sH;
        e24 = eH;
      }
    }

    start = new Date(baseDate);
    start.setHours(s24, sM, 0, 0);

    end = new Date(baseDate);
    end.setHours(e24, eM, 0, 0);

    // If end <= start, assume it crosses noon or midnight (bump end by +12h or +24h)
    if (end <= start) {
      // Try bump by +12h when meridian-less single-digit hours (e.g., 7-9)
      if (!sMer && !eMer && sH <= 12 && eH <= 12) {
        end = addMinutes(end, 12 * 60);
        if (end <= start) end = addMinutes(end, 12 * 60);
      } else {
        end = addMinutes(end, 24 * 60);
      }
    }
  } else {
    // Try 24h HH:mm pattern first (e.g., 14:30)
    const hm24 = searchText.match(hm24Re);
    if (hm24) {
      const H = parseIntSafe(hm24[1]);
      const M = parseIntSafe(hm24[2]);
      start = new Date(baseDate);
      start.setHours(H, M, 0, 0);
      if (durationMin) {
        end = addMinutes(start, durationMin);
      } else {
        end = addMinutes(start, 60);
      }
    } else {
      // Try single 12h time (e.g., "2pm", "9:15a", "7p")
      const t1 = searchText.match(timeSingleRe);
      if (t1) {
        const H = clamp(parseIntSafe(t1[1], 0), 0, 23);
        const M = clamp(parseIntSafe(t1[2] || "0", 0), 0, 59);
        const mer = (t1[3] || "").toLowerCase();
        const H24 = to24h(H, mer);

        start = new Date(baseDate);
        start.setHours(H24, M, 0, 0);
        if (durationMin) {
          end = addMinutes(start, durationMin);
        } else {
          end = addMinutes(start, 60);
        }
      }
    }
  }

  // Relative time "in 30m / in 1h30"
  if (!start && relM) {
    const n1 = parseIntSafe(relM[1], 0);
    const unit1 = (relM[2] || "").toLowerCase();
    const n2 = parseIntSafe(relM[3], 0);
    const unit2 = (relM[4] || "").toLowerCase();

    let offsetMin = 0;
    if (unit1.startsWith("h")) offsetMin += n1 * 60;
    else offsetMin += n1;

    if (n2) {
      offsetMin += n2; // second part is minutes
    }

    start = addMinutes(now, offsetMin);
    end = addMinutes(start, durationMin || 60);
    explicitDayUsed = true;
  }

  // If no explicit time but we have a date (from today/tomorrow/next wed/explicit date)
  if (!start && explicitDayUsed) {
    start = new Date(baseDate);
    // Default sensible time:
    // - if all-day: midnight to midnight next day
    // - else: start at 9:00 for 60 min
    if (allDayHint) {
      start.setHours(0, 0, 0, 0);
      end = addDays(start, 1);
    } else {
      start.setHours(9, 0, 0, 0);
      end = addMinutes(start, durationMin || 60);
    }
  }

  // Fall back: no time parsed at all — bail
  if (!start || !end) return null;

  // Ensure all-day if user asked for it explicitly regardless of time tokens
  let allDay = false;
  if (allDayHint) {
    const sod = startOfDay(start);
    const eod = addDays(sod, 1);
    start = sod;
    end = eod;
    allDay = true;
  }

  // If there is a leftover title need, derive it from the non-time tokens
  if (!title) {
    // Remove nearly all time-ish tokens from raw to infer title
    let t = input;
    // strip leading command words
    t = t.replace(/\b(block|schedule|meeting|mtg|event|call|appointment|appt)\b[:]?\s*/gi, "");
    // remove day words
    t = t.replace(/\b(today|tomorrow|next|this)\b/gi, "");
    t = t.replace(/\b(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/gi, "");
    // remove date and time phrases
    t = t.replace(
      /(\d{4}-\d{1,2}-\d{1,2})|(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)|(\b\d{1,2}(:\d{2})?\s*(a|am|p|pm)\b)|(\b[01]?\d:[0-5]\d\b)|(\bin\s+\d+\s*(m|h|mins?|minutes?|hrs?|hours?)\b)|(\bfor\s+\d+(\s*h(:\d{2})?|\s*(mins?|minutes?))\b)/gi,
      ""
    );
    // strip all-day keywords
    t = t.replace(/\ball\s*day\b/gi, "");
    title = trimPunctuation(t).trim();
  }

  // Cleanup: sometimes email-style extras leak into title; keep it concise
  if (/words?\b/i.test(title) && /polite|friendly|tone|rewrite/i.test(title)) {
    // looks like a preset/mail instruction; move to notes
    const notes = title;
    title = "Untitled";
    return {
      title,
      startISO: toISOInTZ(start, displayTZ),
      endISO: toISOInTZ(end, displayTZ),
      timezone: displayTZ,
      allDay,
      durationMin: Math.round((end - start) / 60000),
      notes,
    };
  }

  // Finalize
  const out = {
    title: title || deriveDefaultTitle(input) || "Untitled",
    startISO: toISOInTZ(start, displayTZ),
    endISO: toISOInTZ(end, displayTZ),
    timezone: displayTZ,
    allDay: allDay || undefined,
    durationMin: Math.round((end - start) / 60000),
  };
  return out;
}

/** ---------- Helpers ---------- */

function to24h(H, meridian) {
  let h = clamp(H, 0, 23);
  const m = (meridian || "").toLowerCase();
  if (!m) {
    // No meridian; if 1..12, keep as-is; if >12, already 24h
    return h;
  }
  if (m === "a" || m === "am") {
    if (h === 12) return 0;
    return h;
  }
  if (m === "p" || m === "pm") {
    if (h < 12) return h + 12;
    return h;
  }
  return h;
}

function deriveDefaultTitle(input) {
  // Grab something human from the tail if user didn't separate
  // e.g., "next wed 14:30 call with supplier" -> "call with supplier"
  const m = input.match(/\b(?:am|pm|\d{1,2}:\d{2}|\d{1,2}[ap])\b\s*(.+)$/i);
  if (m && m[1]) {
    const t = trimPunctuation(m[1]).trim();
    if (t) return t;
  }
  // fallback: after a date token
  const m2 = input.match(/\b(?:today|tomorrow|next|this|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b\s*(.+)$/i);
  if (m2 && m2[1]) {
    const t = trimPunctuation(m2[1]).trim();
    if (t) return t;
  }
  return null;
}
