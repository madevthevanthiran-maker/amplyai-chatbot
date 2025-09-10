// /utils/parseFocus.js
// Supported examples:
//   block 2-4pm today for Deep Work
//   block 10am-11:30am today for Project Alpha
//   block 2025-09-11 10:00-11:30 for Team sync
//   block 9-11 tomorrow for Sprint review

function toTZISOStringLocal(date) {
  // "YYYY-MM-DDTHH:mm:ss" in local time (no offset)
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}` +
         `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseMinutes(piece) {
  const s = piece.trim().toLowerCase();

  // 12h: 9am, 9:30pm
  let m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (m) {
    let h = parseInt(m[1], 10);
    let min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = m[3];
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return h * 60 + min;
    return null;
  }

  // 24h: 10, 10:30, 21:05
  m = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m && !/am|pm/.test(s)) {
    let h = parseInt(m[1], 10);
    let min = m[2] ? parseInt(m[2], 10) : 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return h * 60 + min;
  }

  return null;
}

function baseDateFromToken(t) {
  const k = t.toLowerCase();
  const today = new Date();
  today.setHours(0,0,0,0);

  if (k === "today") return new Date(today);
  if (k === "tomorrow") return new Date(today.getTime() + 86400000);
  if (k === "yesterday") return new Date(today.getTime() - 86400000);

  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function parseFocusText(input) {
  if (!input || typeof input !== "string") {
    return { ok: false, error: "Empty input" };
  }

  const txt = input.trim();
  if (!/^block\s/i.test(txt)) {
    return { ok: false, error: 'Command should start with "block"' };
  }

  const pieces = txt.replace(/^block\s+/i, "");
  const parts = pieces.split(/\s+for\s+/i);
  if (parts.length < 2) {
    return { ok: false, error: 'Add "for <title>" at the end' };
  }

  const timePart = parts[0].trim();
  const title = parts.slice(1).join(" for ").trim() || "Focus block";

  const tokens = timePart.split(/\s+/);
  let baseDate = null;
  let seToken = null;

  for (const t of tokens) {
    if (!baseDate) baseDate = baseDateFromToken(t);
    if (!seToken && t.includes("-")) seToken = t;
  }

  if (!baseDate) baseDate = baseDateFromToken("today");
  if (!seToken) {
    return { ok: false, error: "Provide a start-end time (e.g., 10-11 or 2pm-3:30pm)" };
  }

  let [startRaw, endRaw] = seToken.split("-");
  if (!startRaw || !endRaw) {
    return { ok: false, error: "Could not parse the start/end time" };
  }

  // In case user typed "10:00-11:30am" (missing start am/pm) we try to inherit am/pm from end
  const endHasAmPm = /am|pm/i.test(endRaw);
  if (!/am|pm/i.test(startRaw) && endHasAmPm) {
    const suffix = endRaw.toLowerCase().includes("pm") ? "pm" : "am";
    // Only if start is within 1..12 and not already 24h like 13:00
    if (/^\d{1,2}(:\d{2})?$/.test(startRaw)) {
      const h = parseInt(startRaw, 10);
      if (h >= 1 && h <= 12) startRaw = `${startRaw}${suffix}`;
    }
  }

  const startMin = parseMinutes(startRaw);
  const endMin = parseMinutes(endRaw);

  if (startMin == null || endMin == null) {
    return { ok: false, error: "Could not parse the start/end time" };
  }
  if (endMin <= startMin) {
    return { ok: false, error: "End time must be after start time" };
  }

  const start = new Date(baseDate);
  start.setHours(0,0,0,0);
  start.setMinutes(startMin);

  const end = new Date(baseDate);
  end.setHours(0,0,0,0);
  end.setMinutes(endMin);

  return {
    ok: true,
    data: {
      title,
      startISO: toTZISOStringLocal(start), // "YYYY-MM-DDTHH:mm:ss" (local wall time)
      endISO:   toTZISOStringLocal(end),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    }
  };
}
