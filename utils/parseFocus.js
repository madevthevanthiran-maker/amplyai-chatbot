// /utils/parseFocus.js
// Robust natural-language calendar parser using chrono-node.
// Exported as a DEFAULT function (important: import with `import parseFocus from "@/utils/parseFocus"`)

import * as chrono from "chrono-node";

/**
 * Normalize common range separators to a single hyphen.
 */
function normalizeRange(raw) {
  if (!raw) return "";
  return raw.replace(/[–—−]/g, "-"); // en dash, em dash, minus → hyphen
}

/**
 * Try to extract a human title after an em dash / hyphen separator.
 * e.g. "block 2-4pm tomorrow — Deep Work thesis" -> "Deep Work thesis"
 */
function extractTitle(text) {
  const m =
    text.match(/\s[-–—]\s*(.+)$/) || // space + dash + title
    text.match(/—\s*(.+)$/) ||        // em dash
    text.match(/-\s*(.+)$/);          // hyphen
  return m ? m[1].trim() : null;
}

/**
 * Convert Date -> ISO string safely.
 */
function toISO(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    throw new Error("Invalid Date");
  }
  return d.toISOString();
}

/**
 * Parse a time range like "2-4pm" or "14:00-16:00".
 * Returns { start: Date, end: Date } if possible, otherwise null.
 */
function parseInlineRange(text, refDate, timezone) {
  const t = normalizeRange(text);

  // Quick pattern for things like "2-4pm", "2pm-4pm", "14:00-16:00"
  // We'll try to attach the same date (refDate) to both ends via chrono.
  const m =
    t.match(/\b(\d{1,2}(:\d{2})?\s*(am|pm)?)\s*-\s*(\d{1,2}(:\d{2})?\s*(am|pm)?)\b/i) ||
    t.match(/\b(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\b/i);

  if (!m) return null;

  const left = m[1];
  const right = m[4];

  // If the text also includes an anchored date keyword (tomorrow/next Wed/etc),
  // keep it in the prompt so chrono can resolve the correct day.
  // Otherwise, we prepend "today" so chrono doesn't spill to epoch.
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

  // Ensure end after start; if not, bump end by +1 day (rare but safe)
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

  const refDate = new Date(); // now, let chrono resolve “tomorrow/next Wed”

  // Try to detect range like "2-4pm" first and combine with any day hints in the text.
  const tryRange = parseInlineRange(text, refDate, timezone);

  // Let chrono resolve the general date/time(s) from the text.
  // We use .parse (not parseDate) to get start and end from a single pass if present.
  const results = chrono.parse(text, refDate, { forwardDate: true });

  // Title: prefer tail-after-dash; else if result has a known plaintext after time, fallback to whole text
  const title = extractTitle(text) || text.trim();

  // Case A: explicit inline range recognized (e.g., "2-4pm tomorrow")
  if (tryRange) {
    return {
      title,
      startISO: toISO(tryRange.start),
      endISO: toISO(tryRange.end),
      timezone,
    };
  }

  // Case B: chrono found a single or ranged result
  if (results && results.length > 0) {
    // Pick the first reasonable result
    const r = results[0];

    const start = r.start ? r.start.date() : null;
    const end = r.end ? r.end.date() : null;

    if (start && end) {
      return {
        title,
        startISO: toISO(start),
        endISO: toISO(end),
        timezone,
      };
    }
    if (start) {
      // If only a start is present but no end, default to +1 hour
      const end1 = new Date(start.getTime() + 60 * 60 * 1000);
      return {
        title,
        startISO: toISO(start),
        endISO: toISO(end1),
        timezone,
      };
    }
  }

  // Case C: couldn’t resolve date/time
  throw new Error("Couldn’t parse into a date/time");
}
