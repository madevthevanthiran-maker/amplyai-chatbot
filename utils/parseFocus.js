// /utils/parseFocus.js
// Robust natural-language calendar parser using chrono-node.
// Exported as a DEFAULT function.

import * as chrono from "chrono-node";

/** Normalize common range separators to a single hyphen. */
function normalizeRange(raw) {
  if (!raw) return "";
  return raw.replace(/[–—−]/g, "-"); // en dash, em dash, minus → hyphen
}

/** Extract title after an em dash / hyphen separator. */
function extractTitle(text) {
  const m =
    text.match(/\s[-–—]\s*(.+)$/) || // space + dash + title
    text.match(/—\s*(.+)$/) ||        // em dash
    text.match(/-\s*(.+)$/);          // hyphen
  return m ? m[1].trim() : null;
}

/** Convert Date -> ISO string safely. */
function toISO(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    throw new Error("Invalid Date");
  }
  return d.toISOString();
}

/**
 * Parse inline time range like "2-4pm" or "14:00-16:00".
 * Returns { start: Date, end: Date } if found, else null.
 */
function parseInlineRange(text, refDate) {
  const t = normalizeRange(text);

  const m =
    t.match(/\b(\d{1,2}(:\d{2})?\s*(am|pm)?)\s*-\s*(\d{1,2}(:\d{2})?\s*(am|pm)?)\b/i) ||
    t.match(/\b(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\b/i);

  if (!m) return null;

  const left = m[1];
  const right = m[4];

  // If the phrase includes a day hint, chrono will pick it up from the full text.
  // Otherwise add "today" so parsing doesn’t float.
  const dayHint =
    /\btoday\b|\btmr\b|\btomorrow\b|\bmon(day)?\b|\btue(s|sday)?\b|\bwed(nesday)?\b|\bthu(rsday)?\b|\bfri(day)?\b|\bsat(urday)?\b|\bsun(day)?\b|\bnext\b/i.test(
      t
    )
      ? ""
      : " today";

  const leftParsed = chrono.parseDate(`${left}${dayHint}`, refDate, {
    forwardDate: true,
  });
  const rightParsed = chrono.parseDate(`${right}${dayHint}`, refDate, {
    forwardDate: true,
  });

  if (!leftParsed || !rightParsed) return null;

  if (rightParsed <= leftParsed) {
    rightParsed.setDate(rightParsed.getDate() + 1);
  }

  return { start: leftParsed, end: rightParsed };
}

/**
 * Main parser — returns:
 * {
 *   title: string,
 *   startISO: string,
 *   endISO: string,
 *   timezone: string
 * }
 */
export default function parseFocus(text, opts = {}) {
  if (!text || typeof text !== "string") {
    throw new Error("parseFocus: text is required");
  }

  const timezone =
    opts.timezone ||
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC");

  const refDate = new Date();

  // Prefer explicit inline range if detected (e.g., "2-4pm tomorrow — Deep Work")
  const range = parseInlineRange(text, refDate);

  // Use chrono on the full string to resolve dates like "tomorrow", "next Wed 14:30"
  const results = chrono.parse(text, refDate, { forwardDate: true });

  const title = extractTitle(text) || text.trim();

  if (range) {
    return {
      title,
      startISO: toISO(range.start),
      endISO: toISO(range.end),
      timezone,
    };
  }

  if (results && results.length > 0) {
    const r = results[0];
    const start = r.start ? r.start.date() : null;
    const end = r.end ? r.end.date() : null;

    if (start && end) {
      return { title, startISO: toISO(start), endISO: toISO(end), timezone };
    }
    if (start) {
      const end1 = new Date(start.getTime() + 60 * 60 * 1000);
      return { title, startISO: toISO(start), endISO: toISO(end1), timezone };
    }
  }

  throw new Error("Couldn’t parse into a date/time");
}
