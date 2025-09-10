// /utils/parseFocus.js
// Parse "block ..." text into { title, startISO, endISO, timezone }
//
// Supported examples:
//   block 9-11 today for Deep Work
//   block 2pm-3:30pm tomorrow for sprint
//   block 2025-09-11 10:00-11:30 for Team sync
//   block 09:00-10:30 for Standup (defaults to today)
//   block 9–11 for Focus (en dash supported)
//
// The parser purposely avoids any heavy libs and works with simple regexes.

const UNICODE_DASHES = /[\u2012\u2013\u2014\u2212]/g; // figure/en/em/minus dashes → '-'

function normalizeDashes(s) {
  return s.replace(UNICODE_DASHES, "-");
}

function isDateToken(tok) {
  // YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(tok);
}

function dateForKeyword(keyword) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;

  const k = keyword.toLowerCase();
  if (k === "today") return today;
  if (k === "tomorrow") return new Date(today.getTime() + dayMs);
  if (k === "yesterday") return new Date(today.getTime() - dayMs);
  return null;
}

function parseDateToken(token) {
  if (!isDateToken(token)) return null;
  const d = new Date(`${token}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// returns minutes since midnight or null
function parseTimePiece(piece) {
  const s = piece.trim().toLowerCase();

  // 24h like "9", "09", "9:05", "21:00"
  let m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m && !s.endsWith("am") && !s.endsWith("pm")) {
    let h = parseInt(m[1], 10);
    let min = m[2] ? parseInt(m[2], 10) : 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return h * 60 + min;
  }

  // 12h like "9am", "9:30pm", "12am", "12:15am"
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

// Robustly find a "start-end" time token, ignoring the date token.
// Only accept it if BOTH sides parse as valid times.
function findTimeRangeToken(tokens) {
  for (const raw of tokens) {
    const t = normalizeDashes(raw);

    // Must contain a hyphen
    if (!t.includes("-")) continue;

    // Skip YYYY-MM-DD (date token)
    if (isDateToken(t)) continue;

    const [lhs, rhs] = t.split("-").map((x) => x.trim());
    if (!lhs || !rhs) continue;

    const lhsMin = parseTimePiece(lhs);
    const rhsMin = parseTimePiece(rhs);

    if (lhsMin != null && rhsMin != null) {
      return { token: t, startMin: lhsMin, endMin: rhsMin };
    }
  }
  return null;
}

export function parseFocusText(input, defaultTz) {
  if (!input || typeof input !== "string") {
    return { ok: false, error: "Empty input" };
  }

  const tz =
    defaultTz || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // Normalize dashes so "9–11" works.
  const text = normalizeDashes(input.trim());

  if (!/^block\s/i.test(text)) {
    return { ok: false, error: 'Command should start with "block"' };
  }

  // Split "... for TITLE"
  const parts = text.replace(/^block\s+/i, "").split(/\s+for\s+/i);
  if (parts.length < 2) {
    return { ok: false, error: 'Add "for <title>" at the end' };
  }

  const timePart = parts[0].trim();
  const title = parts.slice(1).join(" for ").trim() || "Focus block";

  // Tokens we’ll inspect for date + time range
  const tokens = timePart.split(/\s+/);

  // 1) Find base date: explicit date or keyword; default to today
  let baseDate = null;
  for (const t of tokens) {
    const kw = dateForKeyword(t);
    if (kw) {
      baseDate = kw;
      break;
    }
    const d = parseDateToken(t);
    if (d) {
      baseDate = d;
      break;
    }
  }
  if (!baseDate) baseDate = dateForKeyword("today");

  // 2) Find the actual time range token ("10:00-11:30", "2pm-3:15pm", etc.)
  const range = findTimeRangeToken(tokens);
  if (!range) {
    return {
      ok: false,
      error: "Provide a start-end time (e.g., 10:00-11:30 or 2pm-3:30pm)",
    };
  }

  const { startMin, endMin } = range;

  if (endMin <= startMin) {
    return { ok: false, error: "End time must be after start time" };
  }

  const startDate = minutesToDate(baseDate, startMin);
  const endDate = minutesToDate(baseDate, endMin);

  // Format ISO "YYYY-MM-DDTHH:mm:ss" (no timezone suffix)
  const startISO = new Date(
    startDate.getTime() - startDate.getMilliseconds()
  )
    .toISOString()
    .slice(0, 19);
  const endISO = new Date(endDate.getTime() - endDate.getMilliseconds())
    .toISOString()
    .slice(0, 19);

  return {
    ok: true,
    data: {
      title,
      startISO,
      endISO,
      timezone: tz,
    },
  };
}
