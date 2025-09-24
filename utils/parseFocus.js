// /utils/parseFocus.js
import * as chrono from "chrono-node";

function normalizeRange(raw = "") { return raw.replace(/[–—−]/g, "-"); }
function extractTitle(text) {
  const m = text.match(/\s[-–—]\s*(.+)$/) || text.match(/—\s*(.+)$/) || text.match(/-\s*(.+)$/);
  return m ? m[1].trim() : null;
}
function toISO(d){ if(!(d instanceof Date)||isNaN(d.getTime())) throw new Error("Invalid Date"); return d.toISOString(); }

function parseInlineRange(text, refDate) {
  const t = normalizeRange(text);
  const m =
    t.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i) ||
    t.match(/\b(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\b/);
  if (!m) return null;
  const [_, left, right] = m;
  const hasDay = /\b(today|tmr|tmrw|tomorrow|next|mon|tue|wed|thu|fri|sat|sun)\b/i.test(t);
  const suffix = hasDay ? "" : " today";
  const start = chrono.parseDate(`${left}${suffix}`, refDate, { forwardDate: true });
  const end   = chrono.parseDate(`${right}${suffix}`, refDate, { forwardDate: true });
  if (!start || !end) return null;
  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
}

export default function parseFocus(text, opts = {}) {
  if (!text || typeof text !== "string") throw new Error("parseFocus: text is required");

  const timezone =
    opts.timezone ||
    (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC");

  const refDate = new Date();
  const cleaned = text.trim();
  const title = extractTitle(cleaned) || cleaned;

  const range = parseInlineRange(cleaned, refDate);
  if (range) return { title, startISO: toISO(range.start), endISO: toISO(range.end), timezone };

  const results = chrono.parse(cleaned, refDate, { forwardDate: true });
  if (results.length > 0) {
    const r = results[0];
    const start = r.start ? r.start.date() : null;
    const end = r.end ? r.end.date() : null;
    if (start && end) return { title, startISO: toISO(start), endISO: toISO(end), timezone };
    if (start) {
      const end1 = new Date(start.getTime() + 60 * 60 * 1000);
      return { title, startISO: toISO(start), endISO: toISO(end1), timezone };
    }
  }

  throw new Error("Couldn’t parse into a date/time");
}
