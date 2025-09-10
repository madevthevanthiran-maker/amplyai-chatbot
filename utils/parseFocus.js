// /utils/parseFocus.js
// Parse "block ..." text into { title, startISO, endISO, timezone }.
// Examples:
//   block 9-11 tomorrow for Deep Work
//   block 2pm-3:30pm today for sprint
//   block 2025-09-08 09:00-11:00 for Something
//   block 2025-09-09 13:00 - 14:30 for Team sync
//
// Times accepted: "9", "9am", "9:30pm", "21:00", "9-11", "9:00-11:15"

function parseTimePiece(piece) {
  const s = piece.trim().toLowerCase();

  // 24h HH or HH:MM
  let m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m && !s.endsWith("am") && !s.endsWith("pm")) {
    let h = parseInt(m[1], 10);
    let min = m[2] ? parseInt(m[2], 10) : 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return h * 60 + min;
  }

  // 12h like "9am", "9:30pm"
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
  const m = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return d;
}

// Format a Date as "YYYY-MM-DDTHH:mm:ss" (local time, no timezone/offset)
function formatLocalISO(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da}T${hh}:${mm}:00`;
}

export function parseFocusText(input, defaultTz) {
  if (!input || typeof input !== "string") {
    return { ok: false, error: "Empty input" };
  }

  const tz =
    defaultTz || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const text = input.trim();

  if (!/^block\s/i.test(text)) {
    return { ok: false, error: 'Command should start with "block"' };
  }

  const parts = text.replace(/^block\s+/i, "").split(/\s+for\s+/i);
  if (parts.length < 2) {
    return { ok: false, error: 'Add "for <title>" at the end' };
  }

  const timePart = parts[0].trim();
  const title = parts.slice(1).join(" for ").trim() || "Focus block";

  const tokens = timePart.split(/\s+/);
  let baseDate = null;

  // Look for date keyword or explicit YYYY-MM-DD
  for (const t of tokens) {
    const dkw = dateForKeyword(t);
    if (dkw) { baseDate = dkw; break; }
    const d = parseDateToken(t);
    if (d) { baseDate = d; break; }
  }
  if (!baseDate) baseDate = dateForKeyword("today");

  // Try to extract start/end times
  let startRaw, endRaw;

  // Case 1: a token like "13:00-14:30"
  const seToken = tokens.find((t) => t.includes("-") && t !== "-");
  if (seToken) {
    [startRaw, endRaw] = seToken.split("-");
  } else {
    // Case 2: separated by space-dash-space → "13:00 - 14:30"
    const dashIndex = tokens.indexOf("-");
    if (dashIndex > 0 && dashIndex < tokens.length - 1) {
      startRaw = tokens[dashIndex - 1];
      endRaw = tokens[dashIndex + 1];
    }
  }

  if (!startRaw || !endRaw) {
    return {
      ok: false,
      error: "Provide a start-end time (e.g., 9-11 or 2pm-3:30pm)",
    };
  }

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

  return {
    ok: true,
    data: {
      title,
      startISO: formatLocalISO(startDate),
      endISO: formatLocalISO(endDate),
      timezone: tz,
    },
  };
}
