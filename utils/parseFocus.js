// /utils/parseFocus.js
// Natural-language → calendar times using chrono-node.
// Always returns BOTH startISO and endISO.
// Import with:  import parseFocus from "@/utils/parseFocus";

import * as chrono from "chrono-node";

/** Replace en/em/minus dashes with hyphen so "2–4pm" parses like "2-4pm". */
function normalizeRange(raw = "") {
  return raw.replace(/[–—−]/g, "-");
}

/** Extract title after a dash, if present. e.g., "… — Deep Work" → "Deep Work" */
function extractTitle(text) {
  const m =
    text.match(/\s[-–—]\s*(.+)$/) || // spaced dash
    text.match(/—\s*(.+)$/) ||       // em dash
    text.match(/-\s*(.+)$/);         // hyphen
  return m ? m[1].trim() : null;
}

/** ISO from Date with guard. */
function toISO(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) throw new Error("Invalid Date");
  return d.toISOString();
}

/**
 * Parse inline time range "2-4pm", "2pm-4pm", "14:00-16:00".
 * Returns { start: Date, end: Date } or null.
 * We let chrono bind the range to the same day using any hints in the text
 * ("tomorrow", "next Wed", etc.). If no hint, we assume "today".
 */
function parseInlineRange(text, refDate) {
  const t = normalizeRange(text);

  const m =
    t.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i) ||
    t.match(/\b(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\b/);

  if (!m) return null;

  const left = m[1];
  const right = m[2];

  const hasDayHint = /\b(today|tmr|tmrw|tomorrow|next|mon|tue|wed|thu|fri|sat|sun)\b/i.test(t);
  const suffix = hasDayHint ? "" : " today";

  const start = chrono.parseDate(`${left}${suffix}`, refDate, { forwardDate: true });
  const end = chrono.parseDate(`${right}${suffix}`, refDate, { forwardDate: true });
  if (!start || !end) return null;

  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Main parse function.
 * Returns: { title, startISO, endISO, timezone }
 */
export default function parseFocus(text, opts = {}) {
  if (!text || typeof text !== "string") throw new Error("parseFocus: text is required");

  const timezone =
    opts.timezone ||
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC");

  const refDate = new Date();
  const cleaned = text.trim();

  // Prefer the part after a dash as the title.
  const title = extractTitle(cleaned) || cleaned;

  // 1) Inline range like "2-4pm", "14:00-16:00"
  const range = parseInlineRange(cleaned, refDate);
  if (range) {
    return {
      title,
      startISO: toISO(range.start),
      endISO: toISO(range.end),
      timezone,
    };
  }

  // 2) General parse via chrono
  const results = chrono.parse(cleaned, refDate, { forwardDate: true });
  if (results.length > 0) {
    const r = results[0];
    const start = r.start?.date?.() ?? (r.start ? r.start.date() : null);
    const end = r.end?.date?.() ?? (r.end ? r.end.date() : null);

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
