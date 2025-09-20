// /utils/parseFocus.js
// Robust natural-language calendar parser using chrono-node.
// Exported as a DEFAULT function (important: import with `import parseFocus from "@/utils/parseFocus"`)

import * as chrono from "chrono-node";

function normalizeRange(raw) {
  if (!raw) return "";
  return raw.replace(/[–—−]/g, "-"); // normalize to simple hyphen
}

function extractTitle(text) {
  const m =
    text.match(/\s[-–—]\s*(.+)$/) ||
    text.match(/—\s*(.+)$/) ||
    text.match(/-\s*(.+)$/);
  return m ? m[1].trim() : null;
}

function toISO(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    throw new Error("Invalid Date");
  }
  return d.toISOString();
}

function parseInlineRange(text, refDate) {
  const t = normalizeRange(text);

  const m =
    t.match(/\b(\d{1,2}(:\d{2})?\s*(am|pm)?)\s*-\s*(\d{1,2}(:\d{2})?\s*(am|pm)?)\b/i) ||
    t.match(/\b(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\b/i);

  if (!m) return null;

  let left = m[1].trim();
  const right = m[4].trim();

  // If right has meridiem (am/pm) and left doesn’t, carry it over
  const rightMer = /am|pm/i.test(right) ? right.match(/(am|pm)/i)[1] : null;
  if (!/am|pm/i.test(left) && rightMer) {
    if (/^\d{1,2}(:\d{2})?$/.test(left)) left = `${left}${rightMer}`;
  }

  const hasDayHint = /\b(tmr|tomorrow|today|mon(day)?|tue(s|sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?|next)\b/i.test(
    t
  );
  const ctx = hasDayHint ? t : `today ${t}`;

  const leftParsed = chrono.parseDate(ctx.replace(m[0], left), refDate, {
    forwardDate: true,
  });
  const rightParsed = chrono.parseDate(ctx.replace(m[0], right), refDate, {
    forwardDate: true,
  });
  if (!leftParsed || !rightParsed) return null;

  if (rightParsed <= leftParsed) rightParsed.setDate(rightParsed.getDate() + 1);

  return { start: leftParsed, end: rightParsed };
}

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

  const ranged = parseInlineRange(text, refDate);
  const title = extractTitle(text) || text.trim();

  if (ranged) {
    return {
      title,
      startISO: toISO(ranged.start),
      endISO: toISO(ranged.end),
      timezone,
    };
  }

  const results = chrono.parse(text, refDate, { forwardDate: true });
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
