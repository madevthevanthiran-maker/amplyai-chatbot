/**
 * Lightweight natural-language → calendar parser for AmplyAI.
 * NOTE: We export BOTH default and named to be import-safe:
 *   import parseFocus from "@/utils/parseFocus"
 *   import { parseFocus } from "@/utils/parseFocus"
 */

const WEEKDAYS = ["sun","mon","tue","wed","thu","fri","sat"];

function toLocalISO(dt) {
  // returns ISO string without milliseconds for consistency
  return new Date(dt).toISOString();
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function parseClock(raw) {
  // returns minutes from midnight
  const s = raw.trim().toLowerCase();
  // formats: "14:30", "2pm", "2:15pm", "09:00", "9 am"
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];

  if (ap === "am") {
    if (hh === 12) hh = 0;
  } else if (ap === "pm") {
    if (hh !== 12) hh += 12;
  }
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function setMinutes(date, minutes) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setMinutes(minutes);
  return d;
}

function nextWeekday(from, targetIdx) {
  const d = new Date(from);
  const cur = d.getDay();
  let delta = targetIdx - cur;
  if (delta <= 0) delta += 7;
  d.setDate(d.getDate() + delta);
  return d;
}

function pickTimezone(tz) {
  try {
    return tz || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return tz || "UTC";
  }
}

/**
 * parseFocus
 * Input: freeform string and optional { timezone, defaultDurationMins }
 * Output: { title, startISO, endISO, timezone }
 *
 * Supports examples:
 *  - "block 2-4pm tomorrow — Deep Work thesis"
 *  - "next wed 14:30 call with supplier"
 *  - "all day tomorrow: study retreat"
 *  - "meeting on 12/10 9am for 2 hours"
 */
function parseFocus(input, opts = {}) {
  const text = (input || "").trim();
  if (!text) throw new Error("Empty input");

  const tz = pickTimezone(opts.timezone);
  const defaultDuration = Number.isFinite(opts.defaultDurationMins)
    ? Math.max(15, opts.defaultDurationMins)
    : 60;

  // Base date (today, local)
  const now = new Date();
  let targetDate = new Date(now);

  // --- detect relative day ---
  if (/\btomorrow\b/i.test(text)) {
    targetDate = addDays(now, 1);
  } else {
    const wd = WEEKDAYS.findIndex(w => new RegExp(`\\b(next\\s+)?${w}(?:nesday|sday|rsday|day)?\\b`, "i").test(text));
    if (wd >= 0) {
      targetDate = nextWeekday(now, wd);
    }
  }

  // --- detect explicit dd/mm or mm/dd or yyyy-mm-dd ---
  const mDate =
    text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/) || // 2025-09-14
    text.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/); // 12/10[/2025]
  if (mDate) {
    if (mDate.length === 4) {
      // yyyy-mm-dd
      const y = parseInt(mDate[1], 10);
      const mo = parseInt(mDate[2], 10) - 1;
      const da = parseInt(mDate[3], 10);
      targetDate = new Date(Date.UTC(y, mo, da));
      // keep as local date by resetting time
      targetDate = startOfDay(new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
    } else {
      // dd/mm or mm/dd → assume dd/mm if day > 12
      let a = parseInt(mDate[1], 10);
      let b = parseInt(mDate[2], 10);
      let y = mDate[3] ? parseInt(mDate[3], 10) : now.getFullYear();
      let day, mon;
      if (a > 12) {
        day = a; mon = b - 1;
      } else if (b > 12) {
        day = b; mon = a - 1;
      } else {
        // prefer dd/mm style
        day = a; mon = b - 1;
      }
      targetDate = startOfDay(new Date(y, mon, day));
    }
  }

  // --- detect time range like "2-4pm" or "9:15-10:45"
  let startMin = null;
  let endMin = null;
  const range = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
  if (range) {
    startMin = parseClock(range[1]);
    endMin = parseClock(range[2]);
  }

  // --- single time like "14:30" or "9am"
  if (startMin == null) {
    const single = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
    if (single) startMin = parseClock(single[1]);
  }
  if (startMin != null && endMin == null) {
    // duration phrase: "for 2 hours" / "for 90 minutes"
    const dur = text.match(/\bfor\s+(\d+)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)\b/i);
    let add = defaultDuration;
    if (dur) {
      const n = parseInt(dur[1], 10);
      const unit = dur[2].toLowerCase();
      add = /hour|hr/.test(unit) ? n * 60 : n;
    }
    endMin = startMin + add;
  }

  // --- detect "all day" ---
  let allDay = /\ball[\s\-]?day\b/i.test(text);

  // Build start/end
  let start = startOfDay(targetDate);
  let end = startOfDay(targetDate);
  if (allDay) {
    // 09:00–17:00 for now to keep dateTime API path (simplifies UI)
    start.setHours(9, 0, 0, 0);
    end.setHours(17, 0, 0, 0);
  } else if (startMin != null) {
    start = setMinutes(targetDate, startMin);
    end = setMinutes(targetDate, Math.max(startMin + 15, endMin ?? startMin + defaultDuration));
  } else {
    // fallback block: next hour for defaultDuration
    const tmp = new Date(targetDate);
    tmp.setHours(now.getHours() + 1, 0, 0, 0);
    start = tmp;
    end = new Date(tmp.getTime() + defaultDuration * 60 * 1000);
  }

  // Extract a title: part after "—" or ":" or trailing phrase
  let title = text;
  const splitDash = text.split("—");
  const splitColon = text.split(":");
  if (splitDash.length > 1) {
    title = splitDash.slice(1).join("—").trim();
  } else if (splitColon.length > 1 && /\ball day\b/i.test(text) === false) {
    // avoid "all day tomorrow: study retreat" losing context
    title = splitColon.slice(1).join(":").trim();
  }
  if (!title) title = "New event";

  return {
    title,
    startISO: toLocalISO(start),
    endISO: toLocalISO(end),
    timezone: tz,
  };
}

// Export BOTH for compatibility with any import style
export { parseFocus };
export default parseFocus;
