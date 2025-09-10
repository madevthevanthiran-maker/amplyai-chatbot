// /utils/parseFocus.js
//
// Robust parser for focus commands like:
//  - block 2-4pm today for Deep Work
//  - block 10am-11:30am tomorrow for Project Alpha
//  - block 2025-09-11 10:00-11:30 for Team sync
//  - block 13:00-14:30 for Client call
//
// Returns:
// { ok: true, data: { title, startISO, endISO, timezone } }
// or
// { ok: false, error: "message" }

function pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

function parseDateKeywordOrISO(part) {
  const kw = part.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (kw.includes("today")) return today;

  if (kw.includes("tomorrow")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }

  // YYYY-MM-DD anywhere in the string
  const m = part.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

// Parse a single time piece like "9", "9am", "9:30pm", "13", "13:15"
function parseSingleTime(token, carriedAmpm /* 'am' | 'pm' | null */) {
  const s = token.trim().toLowerCase();

  // 12h with am/pm (e.g. 9am, 9:30pm)
  let m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3].toLowerCase();

    if (h === 12 && ap === "am") h = 0;
    if (h !== 12 && ap === "pm") h += 12;

    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return { h, min, ampm: ap };
    }
    return null;
  }

  // 24h like "13" or "13:30"
  m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;

    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return { h, min, ampm: null };
    }
    return null;
  }

  // No match
  return null;
}

// Build "YYYY-MM-DDTHH:mm:ss" in the user's local time
function toLocalISO(dateObj, h, min) {
  const d = new Date(dateObj);
  d.setHours(h, min, 0, 0);

  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const HH = pad2(d.getHours());
  const MM = pad2(d.getMinutes());
  const SS = "00";

  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`;
}

export function parseFocusText(input) {
  try {
    if (!input || typeof input !== "string") {
      return { ok: false, error: "Empty input" };
    }

    // Must start with "block "
    const mHead = input.match(/^block\s+(.+)$/i);
    if (!mHead) {
      return { ok: false, error: 'Command should start with "block"' };
    }

    // Split "... for TITLE"
    const parts = mHead[1].split(/\s+for\s+/i);
    if (parts.length < 2) {
      return { ok: false, error: 'Add "for <title>" at the end' };
    }

    const timePartRaw = parts[0].trim();
    const title = parts.slice(1).join(" for ").trim() || "Focus block";

    // Determine base date (YYYY-MM-DD in string, or today/tomorrow keywords)
    let baseDate = parseDateKeywordOrISO(timePartRaw);
    if (!baseDate) {
      // default today
      baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0);
    }

    // Extract a time range like:
    // "9-11", "9:00-11:15", "2-4pm", "10am-11:30am", "10:00-11:30"
    const mRange = timePartRaw.match(
      /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    );
    if (!mRange) {
      return { ok: false, error: "Provide a start-end time (e.g., 9-11, 2-4pm, 10:00-11:30)" };
    }

    let startTok = mRange[1].trim();
    let endTok = mRange[2].trim();

    // If only one side has am/pm, carry to the other logically
    const apStart = (startTok.match(/(am|pm)/i) || [])[1]?.toLowerCase() || null;
    const apEnd = (endTok.match(/(am|pm)/i) || [])[1]?.toLowerCase() || null;
    let carry = null;
    if (apStart && !apEnd) carry = apStart;
    else if (apEnd && !apStart) carry = apEnd;

    const st = parseSingleTime(startTok, carry);
    const en = parseSingleTime(endTok, carry);
    if (!st || !en) {
      return { ok: false, error: "Could not parse the start/end time" };
    }

    // If only one side had am/pm, apply carry
    let startH = st.h;
    let startM = st.min;
    let endH = en.h;
    let endM = en.min;

    // Basic sanity
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    if (endTotal <= startTotal) {
      return { ok: false, error: "End time must be after start time" };
    }

    const startISO = toLocalISO(baseDate, startH, startM);
    const endISO = toLocalISO(baseDate, endH, endM);

    const tz =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

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
    return { ok: false, error: err?.message || "Parse error" };
  }
}
