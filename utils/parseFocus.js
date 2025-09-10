// /utils/parseFocus.js
// Parse "block ..." into { title, startISO, endISO, timezone }
// Supported:
//   block 2025-09-11 10:00-11:30 for Team sync
//   block 10:00-11:30 2025-09-11 for Team sync
//   block 2pm-3:30pm today for sprint
//   block 9-11 tomorrow for research

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toLocalISO(date) {
  // "YYYY-MM-DDTHH:mm:ss" in the user's local wall time (no timezone suffix)
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

function parseDateToken(token) {
  const m = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  return isNaN(dt.getTime()) ? null : dt;
}

function dateForKeyword(token) {
  const t = token.toLowerCase();
  const base = new Date();
  base.setHours(0,0,0,0);
  const day = 24 * 60 * 60 * 1000;
  if (t === "today") return base;
  if (t === "tomorrow") return new Date(base.getTime() + day);
  if (t === "yesterday") return new Date(base.getTime() - day);
  return null;
}

function parseTimePiece(piece) {
  const s = piece.trim().toLowerCase();

  // 12h: 9am, 9:30pm
  let m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (m) {
    let h = +m[1], min = m[2] ? +m[2] : 0;
    const ap = m[3];
    if (h >= 1 && h <= 12 && min >= 0 && min <= 59) {
      if (ap === "pm" && h !== 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
      return h * 60 + min;
    }
  }

  // 24h: 10, 10:00, 23:45
  m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m && !s.endsWith("am") && !s.endsWith("pm")) {
    const h = +m[1], min = m[2] ? +m[2] : 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return h * 60 + min;
  }

  return null;
}

function parseTimeRange(token) {
  // token is like "10:00-11:30", "9-11", "2pm-3:15pm"
  if (!token.includes("-")) return null;
  const [a, b] = token.split("-").map((x) => x.trim());
  const start = parseTimePiece(a);
  const end = parseTimePiece(b);
  if (start == null || end == null || end <= start) return null;
  return { startMin: start, endMin: end };
}

export function parseFocusText(input, defaultTz) {
  if (!input || typeof input !== "string")
    return { ok: false, error: "Empty input" };

  const tz =
    defaultTz ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  const text = input.trim();
  if (!/^block\s/i.test(text))
    return { ok: false, error: 'Command should start with "block"' };

  // Split "... for TITLE"
  const parts = text.replace(/^block\s+/i, "").split(/\s+for\s+/i);
  if (parts.length < 2)
    return { ok: false, error: 'Add "for <title>" at the end' };

  const title = parts.slice(1).join(" for ").trim() || "Focus block";
  const timePart = parts[0].trim();

  // Tokenize
  const tokens = timePart.split(/\s+/);

  // Find date (YYYY-MM-DD) or keyword (today/tomorrow/yesterday)
  let baseDate = null;
  for (const t of tokens) {
    const dk = dateForKeyword(t);
    if (dk) { baseDate = dk; break; }
    const d = parseDateToken(t);
    if (d) { baseDate = d; break; }
  }
  if (!baseDate) {
    // default to today
    baseDate = dateForKeyword("today");
  }

  // Find time range token (X-Y)
  let rangeToken = tokens.find((t) => t.includes("-"));
  if (!rangeToken) {
    return { ok: false, error: "Provide a start-end time (e.g., 10:00-11:30)" };
  }

  const range = parseTimeRange(rangeToken);
  if (!range) {
    return { ok: false, error: "Could not parse the start/end time" };
  }

  // Build local times
  const start = new Date(baseDate);
  start.setHours(0,0,0,0);
  start.setMinutes(range.startMin);
  const end = new Date(baseDate);
  end.setHours(0,0,0,0);
  end.setMinutes(range.endMin);

  return {
    ok: true,
    data: {
      title,
      startISO: toLocalISO(start),
      endISO: toLocalISO(end),
      timezone: tz,
    },
  };
}
