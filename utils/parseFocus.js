// Parse "block ..." text into { title, startISO, endISO, timezone }.
// Supported examples:
//   block 9-11 today for Deep Work
//   block 2pm–3:30pm today for sprint
//   block 2025-09-11 10:00–11:30 for Team sync

function parseTimePiece(piece) {
  // minutes since midnight or null
  const s = piece.trim().toLowerCase();

  // 24h "HH[:mm]"
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

  const k = (keyword || "").toLowerCase();
  if (k === "today") return today;
  if (k === "tomorrow") return new Date(today.getTime() + dayMs);
  if (k === "yesterday") return new Date(today.getTime() - dayMs);
  return null;
}

function parseDateToken(token) {
  // Accepts YYYY-MM-DD
  const m = (token || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function parseFocusText(input, defaultTz) {
  if (!input || typeof input !== "string") return { ok: false, error: "Empty input" };

  const tz = defaultTz || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const text = input.trim();

  // Must start with "block "
  if (!/^block\s/i.test(text)) {
    return { ok: false, error: 'Command should start with "block"' };
  }

  // Normalize any en dash (–) or em dash (—) to simple hyphen
  const normalized = text.replace(/[\u2012\u2013\u2014\u2212]/g, "-");

  // Split out "... for TITLE"
  const parts = normalized.replace(/^block\s+/i, "").split(/\s+for\s+/i);
  if (parts.length < 2) return { ok: false, error: 'Add "for <title>" at the end' };

  const timePart = parts[0].trim();
  const title = parts.slice(1).join(" for ").trim() || "Focus block";

  // Possible forms:
  //   "<start>-<end> <dayKeyword>"
  //   "<date> <start>-<end>"
  //   "<start>-<end> <date>"
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

  // Find start-end token like "9-11" or "9:00-11:30" or "2pm-3:30pm"
  const seToken = tokens.find(t => t.includes("-"));
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

  const startISO = new Date(startDate.getTime()).toISOString().slice(0, 19);
  const endISO = new Date(endDate.getTime()).toISOString().slice(0, 19);

  return {
    ok: true,
    data: { title, startISO, endISO, timezone: tz },
  };
}
