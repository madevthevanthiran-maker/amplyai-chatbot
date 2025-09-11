// /utils/parseFocus.js
// Robust parser for: "block <start>-<end> <day|YYYY-MM-DD> for <title>"
// Examples:
//   block 2-4pm today for Deep Work
//   block 2–3pm today for Focus session          // en dash
//   block 10am to 11:30am tomorrow for Standup   // "to" supported
//   block 2025-09-11 10:00-11:30 for Team sync

function normalizeInput(s) {
  if (!s) return "";
  // Normalize dashes to ASCII hyphen
  s = s.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-");
  // Normalize various spaces to regular space
  s = s.replace(/\u00A0|\u2007|\u202F/g, " ");
  // Support "to" as a range separator
  s = s.replace(/\s+to\s+/gi, "-");
  // Collapse spaces
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function parseTimePiece(piece) {
  // returns minutes since midnight or null
  const s = (piece || "").trim().toLowerCase();

  // HH:MM (24h)
  let m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m && !s.endsWith("am") && !s.endsWith("pm")) {
    let h = +m[1], min = +m[2];
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return h * 60 + min;
  }

  // HH (24h)
  m = s.match(/^(\d{1,2})$/);
  if (m && !s.endsWith("am") && !s.endsWith("pm")) {
    let h = +m[1];
    if (h >= 0 && h <= 23) return h * 60;
  }

  // 12h: "9am", "9:30pm"
  m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (m) {
    let h = +m[1], min = m[2] ? +m[2] : 0, ap = m[3];
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

function dateForKeyword(k) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const DAY = 24 * 60 * 60 * 1000;
  const s = (k || "").toLowerCase();
  if (s === "today") return today;
  if (s === "tomorrow") return new Date(today.getTime() + DAY);
  if (s === "yesterday") return new Date(today.getTime() - DAY);
  return null;
}

function parseDateToken(token) {
  const m = (token || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function parseFocusText(rawInput, defaultTz) {
  try {
    if (typeof rawInput !== "string" || !rawInput.trim()) {
      return { ok: false, error: "Empty input" };
    }

    const tz =
      defaultTz ||
      (typeof Intl !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "UTC";

    let input = normalizeInput(rawInput);

    if (!/^block\s/i.test(input)) {
      return { ok: false, error: 'Command should start with "block"' };
    }

    // Split once on " for "
    const afterBlock = input.replace(/^block\s+/i, "");
    const parts = afterBlock.split(/\s+for\s+/i);
    if (parts.length < 2) {
      return { ok: false, error: 'Add "for <title>" at the end' };
    }
    const timePart = parts[0].trim();
    const title = parts.slice(1).join(" for ").trim() || "Focus block";

    // Tokens for scanning
    const tokens = timePart.split(/\s+/);

    // Find base date
    let baseDate = null;
    for (const t of tokens) {
      baseDate = dateForKeyword(t) || parseDateToken(t) || baseDate;
      if (baseDate) break;
    }
    if (!baseDate) baseDate = dateForKeyword("today");

    // Find range token
    let seToken = tokens.find((t) => t.includes("-"));
    if (!seToken) {
      // Rare: tokens like ["10:00","-","11:30am"]
      for (let i = 0; i < tokens.length - 2; i++) {
        if (tokens[i + 1] === "-") {
          seToken = `${tokens[i]}-${tokens[i + 2]}`;
          break;
        }
      }
    }
    if (!seToken) {
      return {
        ok: false,
        error: "Provide a start–end time (e.g., 2-4pm or 10:00-11:30am)",
      };
    }

    let [rawStart, rawEnd] = seToken.split("-");
    if (!rawStart || !rawEnd) {
      return { ok: false, error: "Could not split the time range" };
    }

    // If only one side has am/pm, copy it across (e.g., "10-11:30am")
    const endAp = (rawEnd.match(/\b(am|pm)\b/i) || [])[1];
    if (endAp && !/\b(am|pm)\b/i.test(rawStart)) {
      rawStart += endAp.toLowerCase();
    }

    const startMin = parseTimePiece(rawStart);
    const endMin = parseTimePiece(rawEnd);

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

    return {
      ok: true,
      data: { title, startISO, endISO, timezone: tz },
    };
  } catch {
    return {
      ok: false,
      error:
        "Parse failed. Try like: `block 2-4pm today for Deep Work` or `block 10am-11:30am tomorrow for Sprint`",
    };
  }
}
