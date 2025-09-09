// /utils/parseFocus.js
// Parse "block ..." text into { title, startISO, endISO, timezone }
// Supported forms:
//   block 9-11 tomorrow for Deep Work
//   block 2pm-3:30pm today for sprint
//   block 2025-09-08 09:00-11:00 for Something
//
// Times accepted: "9", "9am", "9:30", "9:30pm", "21:00", "9-11", "9:00-11:15", and tolerant "13:00pm"

function parseTimePiece(piece) {
  // returns minutes since midnight or null
  let s = String(piece || "").trim().toLowerCase();

  // Detect optional meridiem, but tolerate 24h + meridiem (e.g. "13:00pm")
  const merMatch = s.match(/(am|pm)$/);
  let mer = merMatch ? merMatch[1] : null;

  // Strip meridiem (we'll apply it later if appropriate)
  if (mer) s = s.slice(0, -mer.length);

  // 24h HH[:MM] or bare H/H:MM
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  let min = m[2] ? parseInt(m[2], 10) : 0;
  if (Number.isNaN(h) || Number.isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return null;
  }

  // If hour > 12, ignore any stray am/pm and keep 24-hour
  if (h > 12) {
    mer = null;
  }

  // Apply 12-hour rules only when hour ≤ 12 and meridiem is present
  if (mer && h <= 12) {
    if (mer === "pm" && h !== 12) h += 12;
    if (mer === "am" && h === 12) h = 0;
  }

  return h * 60 + min;
}

function minutesToDate(baseDate, minutes) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}

function dateForKeyword(keyword) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const dayMs = 24 * 60 * 60 * 1000;

  const k = keyword.toLowerCase();
  if (k === "today") return today;
  if (k === "tomorrow") return new Date(today.getTime() + dayMs);
  if (k === "yesterday") return new Date(today.getTime() - dayMs);
  return null;
}

function parseDateToken(token) {
  // Accepts YYYY-MM-DD
  const m = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return d;
}

// Format a Date as local "YYYY-MM-DDTHH:mm:ss" (no UTC conversion)
function formatLocalISO(date) {
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${M}-${d}T${h}:${m}:${s}`;
}

export function parseFocusText(input, defaultTz) {
  if (!input || typeof input !== "string") return { ok: false, error: "Empty input" };

  const tz = defaultTz || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const text = input.trim();

  // Must start with "block "
  if (!/^block\s/i.test(text)) {
    return { ok: false, error: 'Command should start with "block"' };
  }

  // Split out "... for TITLE"
  const parts = text.replace(/^block\s+/i, "").split(/\s+for\s+/i);
  if (parts.length < 2) return { ok: false, error: 'Add "for <title>" at the end' };

  const timePart = parts[0].trim();
  const title = parts.slice(1).join(" for ").trim() || "Focus block";

  // Possible forms:
  //   "<start>-<end> <dayKeyword>"
  //   "<date> <start>-<end>"
  //   "<start>-<end> <date>"
  //   "<date> <start>-<end> tz?"
  const tokens = timePart.split(/\s+/);
  let baseDate = null;
  let startMin = null;
  let endMin = null;

  // Look for date token (YYYY-MM-DD) or day keyword
  for (const t of tokens) {
    const dkw = dateForKeyword(t);
    if (dkw) { baseDate = dkw; break; }
    const d = parseDateToken(t);
    if (d) { baseDate = d; break; }
  }
  if (!baseDate) baseDate = dateForKeyword("today");

  // Find start-end token like "9-11" or "9:00-11:15" or "2pm-3:30pm"
  let seToken = tokens.find(t => t.includes("-"));
  if (!seToken) return { ok: false, error: "Provide a start-end time (e.g., 9-11 or 2pm-3:30pm)" };

  const [startRaw, endRaw] = seToken.split("-");
  startMin = parseTimePiece(startRaw);
  endMin = parseTimePiece(endRaw);
  if (startMin == null || endMin == null) {
    return { ok: false, error: "Could not parse the start/end time" };
  }
  if (endMin <= startMin) {
    return { ok: false, error: "End time must be after start time" };
  }

  const startDate = minutesToDate(baseDate, startMin);
  const endDate = minutesToDate(baseDate, endMin);

  // Local ISO (no UTC shift)
  const startISO = formatLocalISO(startDate);
  const endISO = formatLocalISO(endDate);

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
