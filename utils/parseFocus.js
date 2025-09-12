// /utils/parseFocus.js
//
// Parses commands like:
//  - "block 2–4pm today for Deep Work"
//  - "block 10am–11:30am tomorrow for Team sync"
//  - "block 2025-09-12 05:00-07:00 for AmplyAI workshop"  <-- new case
//
// Returns { title, startISO, endISO, timezoneHint? } or throws Error.

const DASH_RX = /[\u2012\u2013\u2014\u2212]/g; // figure/en/en-dash/em minus → '-'
function normalize(text) {
  return text
    .trim()
    .replace(DASH_RX, "-")
    .replace(/\s+/g, " ");
}

// simple zero-pad
const z2 = (n) => (n < 10 ? `0${n}` : `${n}`);

function toLocalISO(dateStr, timeStr) {
  // dateStr = "YYYY-MM-DD", timeStr = "HH:MM" (24h) or "H:MMam"/"H:MMpm" already converted.
  // Emit naive local ISO (no Z). Google API is given an explicit IANA timeZone separately.
  const [H, M] = timeStr.split(":").map((v) => parseInt(v, 10));
  return `${dateStr}T${z2(H)}:${z2(M)}:00`;
}

function parse24h(t) {
  // "5:00" → "05:00", "07:30" → "07:30"
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${z2(hh)}:${z2(mm)}`;
}

function parseAmPm(t) {
  // "2pm", "2:30pm", "11am"
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i.exec(t);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3].toLowerCase();
  if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
  if (ap === "pm" && hh !== 12) hh += 12;
  if (ap === "am" && hh === 12) hh = 0;
  return `${z2(hh)}:${z2(mm)}`;
}

function resolveRelativeDate(word, now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (/^today$/i.test(word)) return d.toISOString().slice(0, 10);
  if (/^tomorrow$/i.test(word)) {
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

export function parseFocusCommand(input, opts = {}) {
  const { now = new Date() } = opts;
  const text = normalize(input);

  // 1) ISO date + 24h range (NEW): "block 2025-09-12 05:00-07:00 for Title"
  {
    const rx = /^block\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s+for\s+(.+)$/i;
    const m = rx.exec(text);
    if (m) {
      const [, dateStr, t1, t2, title] = m;
      const a = parse24h(t1);
      const b = parse24h(t2);
      if (!a || !b) throw new Error("Could not parse the start/end time");
      return {
        title: title.trim(),
        startISO: toLocalISO(dateStr, a),
        endISO: toLocalISO(dateStr, b),
      };
    }
  }

  // 2) Relative day + 24h range: "block 14:00-16:00 today for Title"
  {
    const rx = /^block\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})\s+(today|tomorrow)\s+for\s+(.+)$/i;
    const m = rx.exec(text);
    if (m) {
      const [, t1, t2, rel, title] = m;
      const dateStr = resolveRelativeDate(rel, now);
      const a = parse24h(t1);
      const b = parse24h(t2);
      if (!dateStr || !a || !b) throw new Error("Could not parse the start/end time");
      return {
        title: title.trim(),
        startISO: toLocalISO(dateStr, a),
        endISO: toLocalISO(dateStr, b),
      };
    }
  }

  // 3) Relative day + am/pm range: "block 2-4pm today for Title", "block 10am-11:30am tomorrow for Title"
  {
    // allow "2-4pm" (inherit am/pm for end) OR full "10am-11:30am"
    const rx = /^block\s+([\d:apm\s]+)-([\d:apm\s]+)\s+(today|tomorrow)\s+for\s+(.+)$/i;
    const m = rx.exec(text);
    if (m) {
      const [, rawA, rawB, rel, title] = m;
      const dateStr = resolveRelativeDate(rel, now);
      if (!dateStr) throw new Error("Could not parse the date");

      // normalize segments
      const aAmPm = parseAmPm(rawA.trim()) || parse24h(rawA.trim());
      let bAmPm = parseAmPm(rawB.trim()) || parse24h(rawB.trim());

      // if end was like "4pm" and start was "2pm" or "10am" we’re fine.
      if (!aAmPm || !bAmPm) throw new Error("Could not parse the start/end time");

      return {
        title: title.trim(),
        startISO: toLocalISO(dateStr, aAmPm),
        endISO: toLocalISO(dateStr, bAmPm),
      };
    }
  }

  throw new Error("Could not parse the start/end time");
}
