/**
 * Permanent, dependency-light natural-language time parser for AmplyAI.
 * Supports:
 *  - “next wed 14:30 call with supplier”
 *  - “block 2–4pm tomorrow — Deep Work thesis”
 *  - “meeting on 12/10 9am for 2 hours”
 *  - “all day tomorrow: study retreat”
 *
 * Returns a canonical structure the calendar API can consume.
 */

const MS = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
};

function toIanaTZ(tzGuess) {
  // Accepts “Asia/Singapore” etc. If missing, fall back to env or browser guess.
  if (typeof tzGuess === "string" && tzGuess.includes("/")) return tzGuess;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function clampDate(d) {
  // Guard against invalid dates.
  if (!(d instanceof Date) || isNaN(d.getTime())) return new Date();
  return d;
}

function nextDow(from, targetDow) {
  const d = new Date(from.getTime());
  const delta = (7 + targetDow - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d;
}

function parseClock(s) {
  // "14:30" / "2:30 pm" / "2pm" / "9 am"
  const m =
    s.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?$/i) ||
    s.match(/^(\d{1,2})\s*[:h]\s*(\d{2})\s*(am|pm)?$/i);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2] || "0", 10);
  const ampm = (m[3] || "").toLowerCase();
  if (ampm === "pm" && hh < 12) hh += 12;
  if (ampm === "am" && hh === 12) hh = 0;
  if (hh > 23 || mm > 59) return null;
  return { hh, mm };
}

function parseDateish(s, now) {
  // “tomorrow”, “today”, “next wed”, “this fri”, explicit dd/mm[/yyyy]
  const lower = s.toLowerCase();

  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return d;
  }
  if (/\btoday\b/.test(lower)) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // “next wed” / “next wednesday”
  const dowMap = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tues: 2, tuesday: 2,
    wed: 3, weds: 3, wednesday: 3,
    thu: 4, thurs: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
  };

  const nextM = lower.match(/\bnext\s+([a-z]+)\b/);
  const thisM = lower.match(/\bthis\s+([a-z]+)\b/);
  if (nextM && dowMap[nextM[1]] != null) {
    return nextDow(now, dowMap[nextM[1]]);
  }
  if (thisM && dowMap[thisM[1]] != null) {
    // “this wed”: today if it is that day, else next occurrence this week
    const target = dowMap[thisM[1]];
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const delta = (7 + target - d.getDay()) % 7;
    d.setDate(d.getDate() + delta);
    return d;
  }

  // dd/mm[/yyyy] or mm/dd (we don’t guess locale, we accept dd/mm explicitly)
  const slash = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (slash) {
    let dd = parseInt(slash[1], 10);
    let mm = parseInt(slash[2], 10);
    let yyyy = slash[3] ? parseInt(slash[3], 10) : now.getFullYear();
    if (yyyy < 100) yyyy += 2000;
    // Heuristic: if mm > 12, treat we’re in dd/mm. If both <=12, assume dd/mm by design.
    if (mm < 1 || mm > 12) return null;
    const d = new Date(yyyy, mm - 1, dd);
    return d;
  }

  return null;
}

function parseDuration(s) {
  // “for 2 hours” / “1h” / “90m”
  const lower = s.toLowerCase();
  const m1 = lower.match(/\bfor\s+(\d+)\s*(hour|hours|hr|h|minute|minutes|min|m)\b/);
  if (m1) {
    const n = parseInt(m1[1], 10);
    const unit = m1[2][0];
    return unit === "h" ? n * MS.hour : n * MS.minute;
  }
  const m2 = lower.match(/\b(\d+)\s*h\b/);
  if (m2) return parseInt(m2[1], 10) * MS.hour;
  const m3 = lower.match(/\b(\d+)\s*m\b/);
  if (m3) return parseInt(m3[1], 10) * MS.minute;
  return null;
}

function normalizeTitle(s) {
  return s
    .replace(/\s*—\s*/g, " — ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * parseFocus(input, { now?: Date, tz?: string })
 * Output:
 *  {
 *    ok: boolean,
 *    intent: "block" | "meeting" | "event",
 *    title: string,
 *    start: string (ISO),
 *    end: string (ISO),
 *    allDay?: boolean,
 *    tz: string,
 *    debug?: any
 *  }
 */
function parseFocus(input, opts = {}) {
  const now = clampDate(opts.now || new Date());
  const tz = toIanaTZ(opts.tz);

  const raw = String(input || "");
  const lower = raw.toLowerCase();

  // Intent
  const intent =
    /\bblock\b/.test(lower) ? "block" :
    /\bcall|meet|meeting|standup|1:1|1-1\b/.test(lower) ? "meeting" :
    "event";

  // All-day?
  const allDay = /\ball[-\s]*day\b/.test(lower);

  // Title (everything after “—” or after time chunk)
  let title = raw.split("—").slice(1).join("—").trim();
  if (!title) {
    // Remove leading tokens like “block”, “meeting”, “next wed 14:30”
    title = raw
      .replace(/\b(block|meeting|meet|call|all\s*day)\b/gi, "")
      .replace(/\b(next|this|tomorrow|today)\b/gi, "")
      .replace(/\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, "")
      .replace(/\b(\d{1,2})(?::?\d{2})?\s*(am|pm)?\b/gi, "")
      .replace(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/g, "")
      .replace(/\bfor\s+\d+\s*(h|hour|hours|min|minutes|m)\b/gi, "")
      .replace(/[—–-]+/g, " ")
      .trim();
  }
  title = title || (intent === "block" ? "Focus block" : "Meeting");

  // Date
  const date = parseDateish(lower, now) || new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Time window
  let start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0, 0, 0);
  let end = new Date(start.getTime() + MS.hour);

  if (allDay) {
    // all-day ranges in Calendar must be midnight-midnight, ISO without time portion
    start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    end = new Date(start.getTime() + MS.day);
  } else {
    // “2–4pm”, “14:30”, “7pm-9pm”
    // range
    const range = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–—]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/);
    if (range) {
      const t1 = parseClock(range[1].replace(/\s/g, ""));
      const t2 = parseClock(range[2].replace(/\s/g, ""));
      if (t1) start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), t1.hh, t1.mm);
      if (t2) end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), t2.hh, t2.mm);
    } else {
      // single time
      const tOnly = lower.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/);
      if (tOnly) {
        const t = parseClock(tOnly[1].replace(/\s/g, ""));
        if (t) {
          start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), t.hh, t.mm);
          const dur = parseDuration(lower) || (intent === "block" ? 2 * MS.hour : MS.hour);
          end = new Date(start.getTime() + dur);
        }
      } else {
        const dur = parseDuration(lower) || (intent === "block" ? 2 * MS.hour : MS.hour);
        end = new Date(start.getTime() + dur);
      }
    }
  }

  return {
    ok: true,
    intent,
    title: normalizeTitle(title),
    start: start.toISOString(),
    end: end.toISOString(),
    allDay,
    tz,
    debug: { raw },
  };
}

// named + default export so both import styles work
export { parseFocus };
export default parseFocus;
