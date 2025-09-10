// /utils/parseFocus.js
// Parse "block ..." into { title, startISO, endISO, timezone } with zero deps.
// Supported examples (case-insensitive, spaces flexible, hyphen or en-dash):
//   block 2-4pm today for Deep Work
//   block 10am-11:30am today for Project Alpha
//   block 10:00-11:30 tomorrow for Team sync
//   block 2025-09-11 10:00-11:30 for Team sync
//   block 14-16 for Focus (24h)
//   block 9-11 for Focus (24h)
//
// Notes:
// - If only one side of the range has am/pm, we apply it to the other side.
// - If neither side has am/pm, we treat as 24h (e.g., 10-11:30 = 10:00-11:30).
// - Date can be "today", "tomorrow", "yesterday", or an ISO date YYYY-MM-DD.
// - We return HH:mm:ss ISO strings without timezone suffix, and include timezone
//   separately (server uses it).

function clamp2(n) {
  return String(n).padStart(2, "0");
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKeywordToDate(keyword) {
  const t = startOfDay(new Date());
  const oneDay = 24 * 60 * 60 * 1000;
  const k = String(keyword || "").toLowerCase();
  if (k === "today") return t;
  if (k === "tomorrow") return new Date(t.getTime() + oneDay);
  if (k === "yesterday") return new Date(t.getTime() - oneDay);
  return null;
}

function parseISODate(token) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(token);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

function toMinutes24h(hh, mm) {
  return hh * 60 + mm;
}

// Returns minutes since midnight [0..1439], interpreting piece like:
// "9", "9:30", "9am", "9:30am", "14", "14:30"
function parseTimePiece(piece, ampmHint = null) {
  const s = String(piece).trim().toLowerCase();
  const ampm = /am|pm/.exec(s)?.[0] ?? ampmHint; // pick explicit or hint

  // Extract hour/minute without am/pm
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/.exec(s);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  let mm = m[2] ? parseInt(m[2], 10) : 0;

  if (hh > 23 || mm > 59) return null;

  if (m[3] || ampm) {
    // 12h mode
    const tag = (m[3] || ampm).toLowerCase();
    if (hh < 1 || hh > 12) return null;
    if (tag === "pm" && hh !== 12) hh += 12;
    if (tag === "am" && hh === 12) hh = 0;
  }
  // else: 24h interpretation

  return toMinutes24h(hh, mm);
}

function minutesToLocalISO(dateObj, minutesSinceMidnight) {
  const d = new Date(dateObj);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutesSinceMidnight);
  // Return "YYYY-MM-DDTHH:mm:ss" (no trailing Z)
  const y = d.getFullYear();
  const m = clamp2(d.getMonth() + 1);
  const day = clamp2(d.getDate());
  const hh = clamp2(d.getHours());
  const mm = clamp2(d.getMinutes());
  const ss = clamp2(d.getSeconds());
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
}

export function parseFocusCommand(input, defaultTz) {
  if (!input || typeof input !== "string") {
    return { ok: false, error: "Empty input" };
  }

  // Must start with "block"
  let txt = input.trim().replace(/^block\s+/i, "");
  if (txt === input.trim()) {
    return { ok: false, error: 'Command must start with "block"' };
  }

  // normalize weird dash to hyphen
  txt = txt.replace(/–|—/g, "-");

  // Split title by " for "
  const forSplit = txt.split(/\s+for\s+/i);
  if (forSplit.length < 2) {
    return { ok: false, error: 'Add a title using "for <title>"' };
  }
  const left = forSplit[0].trim();
  const title = forSplit.slice(1).join(" for ").trim() || "Focus block";

  // tokens for left part (date + time-range in any order)
  const tokens = left.split(/\s+/);

  // find date or keyword
  let baseDate = null;
  for (const t of tokens) {
    baseDate = dayKeywordToDate(t) || parseISODate(t) || baseDate;
  }
  if (!baseDate) baseDate = dayKeywordToDate("today");

  // find a token that has a hyphen -> time range
  const rangeToken = tokens.find((t) => t.includes("-"));
  if (!rangeToken) {
    return { ok: false, error: "Provide a start-end time (e.g., 10-11:30 or 2pm-4pm)" };
  }

  const [rawStart, rawEnd] = rangeToken.split("-");
  if (!rawStart || !rawEnd) {
    return { ok: false, error: "Invalid time range" };
  }

  // Figure out am/pm propagation:
  const startHasAP = /(am|pm)/i.test(rawStart);
  const endHasAP = /(am|pm)/i.test(rawEnd);
  let apHint = null;
  if (startHasAP && !endHasAP) apHint = /pm/i.test(rawStart) ? "pm" : "am";
  if (!startHasAP && endHasAP) apHint = /pm/i.test(rawEnd) ? "pm" : "am";

  const startMin = parseTimePiece(rawStart, apHint);
  const endMin = parseTimePiece(rawEnd, apHint);
  if (startMin == null || endMin == null) {
    return { ok: false, error: "Could not parse the start/end time" };
  }
  if (endMin <= startMin) {
    return { ok: false, error: "End time must be after start time" };
  }

  const tz = defaultTz || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const startISO = minutesToLocalISO(baseDate, startMin);
  const endISO = minutesToLocalISO(baseDate, endMin);

  return {
    ok: true,
    data: { title, startISO, endISO, timezone: tz },
  };
}
