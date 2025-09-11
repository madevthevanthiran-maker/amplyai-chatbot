// /utils/parseFocus.js
// Parse "block ..." text into { title, startISO, endISO, timezone }
// Supported examples:
//   block 2-4pm today for Deep Work
//   block 10–11:30am today for Project Alpha        (en-dash ok)
//   block 10am to 11am tomorrow for Standup         ("to" ok)
//   block 2025-09-08 09:00-11:00 for Something
//
// NOTE: We normalize en/em/minus dashes to "-", and trim weird spaces.

function normalizeInput(s) {
  if (!s) return "";
  // replace en dash, em dash, figure dash, minus sign → hyphen
  s = s.replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-");
  // replace " to " with hyphen (loosely, any spaces around)
  s = s.replace(/\s+to\s+/gi, "-");
  // collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function parseTimePiece(piece) {
  // returns minutes since midnight or null
  const s = piece.trim().toLowerCase();

  // 24h HH or HH:MM
  let m = s.match(/^(\d{1,2})(?::(\d{2}))$/);
  if (m && !s.endsWith("am") && !s.endsWith("pm")) {
    let h = parseInt(m[1], 10);
    let min = m[2] ? parseInt(m[2], 10) : 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return h * 60 + min;
  }

  // bare hour like "9" or "21" (24h)
  m = s.match(/^(\d{1,2})$/);
  if (m && !s.endsWith("am") && !s.endsWith("pm")) {
    let h = parseInt(m[1], 10);
    if (h >= 0 && h <= 23) return h * 60;
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
  if (isNaN(d.getTime())) return null;
  return d;
}

export function parseFocusText(input, defaultTz) {
  try {
    if (!input || typeof input !== "string") {
      return { ok: false, error: "Empty input" };
    }

    const tz =
      defaultTz ||
      (typeof Intl !== "undefined" &&
        Intl.DateTimeFormat().resolvedOptions().timeZone) ||
      "UTC";

    // Must start with "block "
    let text = normalizeInput(input);
    if (!/^block\s/i.test(text)) {
      return { ok: false, error: 'Command should start with "block"' };
    }

    // Split "... for TITLE" (use the first " for " occurrence so titles can have "for")
    const forMatch = text.replace(/^block\s+/i, "");
    const parts = forMatch.split(/\s+for\s+/i);
    if (parts.length < 2) {
      return { ok: false, error: 'Add "for <title>" at the end' };
    }
    const timePart = parts[0].trim();
    const title = parts.slice(1).join(" for ").trim() || "Focus block";

    // Identify base date: keyword (today/tomorrow/yesterday) or literal YYYY-MM-DD
    const tokens = timePart.split(/\s+/);
    let baseDate = null;

    for (const t of tokens) {
      const dkw = dateForKeyword(t);
      if (dkw) {
        baseDate = dkw;
        break;
      }
      const d = parseDateToken(t);
      if (d) {
        baseDate = d;
        break;
      }
    }
    if (!baseDate) baseDate = dateForKeyword("today");

    // Find start-end chunk: token that contains a hyphen after normalization
    let seToken = tokens.find((t) => t.includes("-"));
    // In case the range got separated by spaces (rare), re-join neighbors
    if (!seToken) {
      // Try to stitch something like "10:00" "-" "11:30am"
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
        error: "Provide a start–end time (e.g., 9-11 or 2pm-3:30pm)",
      };
    }

    // Split range
    const [startRaw0, endRaw0] = seToken.split("-");
    if (!startRaw0 || !endRaw0) {
      return { ok: false, error: "Could not split the time range" };
    }

    // If only one side has am/pm, copy it to the other (common shorthand: "10-11:30am")
    const apEnd = endRaw0.match(/\b(am|pm)\b/i)?.[1]?.toLowerCase();
    let startRaw = startRaw0;
    let endRaw = endRaw0;
    if (!/\b(am|pm)\b/i.test(startRaw) && apEnd) {
      startRaw = `${startRaw}${apEnd}`;
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

    // API expects "YYYY-MM-DDTHH:mm:ss" (no timezone suffix here; tz provided separately)
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
  } catch (err) {
    return {
      ok: false,
      error: "Parse failed. Try e.g. `block 2-4pm today for Deep Work`",
    };
  }
}
