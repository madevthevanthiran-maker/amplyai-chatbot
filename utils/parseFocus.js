// /utils/parseFocus.js
//
// Robust parser for focus commands like:
//   block 2025-09-11 10:00-11:30 for Team sync
//   block 10am–11:30am tomorrow for Project Alpha
//   block 2—4pm today for Deep Work
//   block 13:00−14:30 for Client call

function pad2(n) { return n < 10 ? "0" + n : "" + n; }

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

  // YYYY-MM-DD anywhere
  const m = part.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

// Parse a single time token: "9", "9am", "9:30pm", "13", "13:15"
function parseSingleTime(token) {
  const s = token.trim().toLowerCase();

  // 12h with am/pm
  let m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3].toLowerCase();
    if (h === 12 && ap === "am") h = 0;
    if (h !== 12 && ap === "pm") h += 12;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return { h, min, ap };
    return null;
  }

  // 24h
  m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return { h, min, ap: null };
    return null;
  }

  return null;
}

function toLocalISO(dateObj, h, min) {
  const d = new Date(dateObj);
  d.setHours(h, min, 0, 0);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const HH = pad2(d.getHours());
  const MM = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:00`;
}

export function parseFocusText(input) {
  try {
    if (!input || typeof input !== "string") return { ok: false, error: "Empty input" };

    // Must start with "block "
    const mHead = input.match(/^block\s+(.+)$/i);
    if (!mHead) return { ok: false, error: 'Command should start with "block"' };

    // Split "... for TITLE"
    const parts = mHead[1].split(/\s+for\s+/i);
    if (parts.length < 2) return { ok: false, error: 'Add "for <title>" at the end' };

    const timePartRaw = parts[0].trim();
    const title = parts.slice(1).join(" for ").trim() || "Focus block";

    // Base date from keyword or ISO
    let baseDate = parseDateKeywordOrISO(timePartRaw);
    if (!baseDate) {
      baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0);
    }

    // Accept -, – (en dash), — (em dash), − (minus)
    const dashClass = "[-–—−]";
    const rangeRe = new RegExp(
      `(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?)\\s*${dashClass}\\s*(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?)`,
      "i"
    );

    const mRange = timePartRaw.match(rangeRe);
    if (!mRange) {
      return { ok: false, error: "Provide a start-end time (e.g., 10:00-11:30, 2-4pm, 10am–11:30am)" };
    }

    let startTok = mRange[1].trim();
    let endTok = mRange[2].trim();

    // If only one side has am/pm, carry it to the other
    const apStart = (startTok.match(/(am|pm)/i) || [])[1]?.toLowerCase() || null;
    const apEnd = (endTok.match(/(am|pm)/i) || [])[1]?.toLowerCase() || null;

    // If one has am/pm and the other doesn't, append it to the missing side
    if (apStart && !apEnd && !/(am|pm)$/i.test(endTok)) endTok += apStart;
    if (apEnd && !apStart && !/(am|pm)$/i.test(startTok)) startTok += apEnd;

    const st = parseSingleTime(startTok);
    const en = parseSingleTime(endTok);
    if (!st || !en) return { ok: false, error: "Could not parse the start/end time" };

    const startTotal = st.h * 60 + st.min;
    const endTotal = en.h * 60 + en.min;
    if (endTotal <= startTotal) return { ok: false, error: "End time must be after start time" };

    const startISO = toLocalISO(baseDate, st.h, st.min);
    const endISO = toLocalISO(baseDate, en.h, en.min);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    return { ok: true, data: { title, startISO, endISO, timezone: tz } };
  } catch (e) {
    return { ok: false, error: e?.message || "Parse error" };
  }
}
