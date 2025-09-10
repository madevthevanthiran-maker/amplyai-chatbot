// /utils/parseFocus.js
// Parses commands like:
//   block 2-4pm today for Deep Work
//   block 10am-11:30am tomorrow for Project Alpha
//   block 2025-09-11 10:00-11:30 for Team sync
//
// Returns { ok: true, data: { title, startISO, endISO, timezone } } or { ok:false, error }

function parseTimePiece(piece) {
  const s = (piece || "").trim().toLowerCase();

  // 24h: 9 / 09 / 9:30 / 21:05
  let m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m && !s.endsWith("am") && !s.endsWith("pm")) {
    let h = parseInt(m[1], 10);
    let min = m[2] ? parseInt(m[2], 10) : 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return h * 60 + min;
  }

  // 12h: 9am / 9:30pm
  m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (m) {
    let h = parseInt(m[1], 10);
    let min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3];
    if (h >= 1 && h <= 12 && min >= 0 && min <= 59) {
      if (ap === "pm" && h !== 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
      return h * 60 + min;
    }
  }
  return null;
}

function minutesToDate(baseDate, minutes) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

function dayKeywordToDate(tok) {
  const k = (tok || "").toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;
  if (k === "today") return today;
  if (k === "tomorrow") return new Date(today.getTime() + dayMs);
  if (k === "yesterday") return new Date(today.getTime() - dayMs);
  return null;
}

function parseIsoDate(tok) {
  const m = (tok || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function parseFocusText(input, defaultTz) {
  if (!input || typeof input !== "string") return { ok: false, error: "Empty input" };

  const tz = defaultTz || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const text = input.trim();

  if (!/^block\s/i.test(text)) return { ok: false, error: 'Command should start with "block"' };

  const parts = text.replace(/^block\s+/i, "").split(/\s+for\s+/i);
  if (parts.length < 2) return { ok: false, error: 'Add "for <title>" at the end' };

  const timePart = parts[0].trim();
  const title = parts.slice(1).join(" for ").trim() || "Focus block";

  const tokens = timePart.split(/\s+/);
  let baseDate = null;

  // First pass: find day keyword or explicit date
  for (const t of tokens) {
    const dk = dayKeywordToDate(t);
    if (dk) { baseDate = dk; break; }
    const d = parseIsoDate(t);
    if (d) { baseDate = d; break; }
  }
  if (!baseDate) baseDate = dayKeywordToDate("today");

  // Find "start-end" token (e.g., 10am-11:30am)
  const seTok = tokens.find(t => t.includes("-"));
  if (!seTok) return { ok: false, error: "Provide a start-end time (e.g., 9-11 or 2pm-3:30pm)" };

  const [startRaw, endRaw] = seTok.split("-");
  const startMin = parseTimePiece(startRaw);
  const endMin = parseTimePiece(endRaw);

  if (startMin == null || endMin == null) {
    return { ok: false, error: "Could not parse the start/end time" };
  }
  if (endMin <= startMin) {
    return { ok: false, error: "End time must be after start time" };
  }

  const startDate = minutesToDate(baseDate, startMin);
  const endDate = minutesToDate(baseDate, endMin);

  const startISO = new Date(startDate.getTime() - startDate.getMilliseconds())
    .toISOString()
    .slice(0, 19);
  const endISO = new Date(endDate.getTime() - endDate.getMilliseconds())
    .toISOString()
    .slice(0, 19);

  return { ok: true, data: { title, startISO, endISO, timezone: tz } };
}
