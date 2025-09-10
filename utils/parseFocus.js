// /utils/parseFocus.js
// Parse "block ..." into { title, startISO, endISO, timezone, rrule? }
//
// Examples handled:
//   block 9-11 today for Deep Work
//   block 2pm-3:30pm tomorrow for sprint
//   block 2025-09-11 10:00-11:30 for Team sync      <-- fixed
//   block 9-11 every day for reading
//   block 9-10 every week for retro
//   block 8-9 every weekday for gym
//   block 10-11 every mon wed fri for standup
//   block 8-9 every 2 weeks for check-in
//   block 7-8 every 3 days for practice
//
// Output times are ISO (no timezone suffix), and `timezone` is supplied
// so Google Calendar interprets correctly.

const DAY_MAP = {
  sunday: "SU", sun: "SU",
  monday: "MO", mon: "MO",
  tuesday: "TU", tue: "TU", tues: "TU",
  wednesday: "WE", wed: "WE",
  thursday: "TH", thu: "TH", thur: "TH", thurs: "TH",
  friday: "FR", fri: "FR",
  saturday: "SA", sat: "SA",
};

function parseTimePiece(piece) {
  // returns minutes since midnight or null
  const s = piece.trim().toLowerCase();

  // 24h "HH" or "HH:MM"
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
  // Accepts YYYY-MM-DD
  const m = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return d;
}

function isDateToken(token) {
  return /^\d{4}-\d{2}-\d{2}$/.test(token);
}

function nextDateForDow(dowCode, base = new Date()) {
  // dowCode: "MO", "TU", ...
  const target = ["SU","MO","TU","WE","TH","FR","SA"].indexOf(dowCode);
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  let cur = d.getDay(); // 0..6 where 0=Sun
  let diff = target - cur;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d;
}

// Robustly find a time range inside tokens.
// Handles:
//   ["10:00-11:30", ...]
//   ["10:00", "-", "11:30", ...]
//   ["10:00", "to", "11:30", ...]
function extractTimeRange(tokens) {
  // Case A: combined token with '-'
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.includes("-") && !isDateToken(t)) {
      const [a, b] = t.split("-");
      const sa = parseTimePiece(a);
      const sb = parseTimePiece(b);
      if (sa != null && sb != null) {
        return { startMin: sa, endMin: sb };
      }
    }
  }
  // Case B: spaced "A - B" or "A to B"
  for (let i = 0; i + 2 < tokens.length; i++) {
    const a = tokens[i], mid = tokens[i + 1].toLowerCase(), b = tokens[i + 2];
    if ((mid === "-" || mid === "to")) {
      const sa = parseTimePiece(a);
      const sb = parseTimePiece(b);
      if (sa != null && sb != null) {
        return { startMin: sa, endMin: sb };
      }
    }
  }
  return null;
}

function parseRecurrence(raw) {
  // Returns { rrule: '...', byday: ['MO','WE',...'] } or null
  const s = raw.toLowerCase();

  // every weekday(s)
  if (/\bevery\s+weekdays?\b/.test(s) || /\bweekdays?\b/.test(s)) {
    return { rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", byday: ["MO","TU","WE","TH","FR"] };
  }

  // collect day codes after 'every'
  const foundCodes = [];
  for (const key of Object.keys(DAY_MAP)) {
    const code = DAY_MAP[key];
    const re = new RegExp(`\\bevery\\s+(${key})\\b`);
    if (re.test(s)) {
      if (!foundCodes.includes(code)) foundCodes.push(code);
    }
  }
  if (foundCodes.length) {
    // interval?
    const intervalMatch = s.match(/\bevery\s+(\d+)\s+weeks?\b/);
    const interval = intervalMatch ? parseInt(intervalMatch[1], 10) : 1;
    return { rrule: `FREQ=WEEKLY;BYDAY=${foundCodes.join(",")}${interval > 1 ? `;INTERVAL=${interval}` : ""}`, byday: foundCodes };
  }

  // daily / every N days
  if (/\bdaily\b/.test(s) || /\bevery\s+day\b/.test(s)) {
    const m = s.match(/\bevery\s+(\d+)\s+days?\b/);
    const interval = m ? parseInt(m[1], 10) : 1;
    return { rrule: `FREQ=DAILY${interval > 1 ? `;INTERVAL=${interval}` : ""}` };
  }

  // weekly / every N weeks (without specific BYDAY)
  if (/\bweekly\b/.test(s) || /\bevery\s+week\b/.test(s) || /\bevery\s+\d+\s+weeks?\b/.test(s)) {
    const m = s.match(/\bevery\s+(\d+)\s+weeks?\b/);
    const interval = m ? parseInt(m[1], 10) : 1;
    return { rrule: `FREQ=WEEKLY${interval > 1 ? `;INTERVAL=${interval}` : ""}` };
  }

  return null;
}

export function parseFocusText(input, defaultTz) {
  if (!input || typeof input !== "string") return { ok: false, error: "Empty input" };

  const tz = defaultTz || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const text = input.trim();

  if (!/^block\s/i.test(text)) {
    return { ok: false, error: 'Command should start with "block"' };
  }

  // Split on the LAST " for " → allows phrases like "every 2 weeks" earlier.
  const lower = text.toLowerCase();
  const idx = lower.lastIndexOf(" for ");
  if (idx === -1) return { ok: false, error: 'Finish with "for <title>"' };

  const left = text.slice(0, idx).replace(/^block\s+/i, "").trim(); // time/date/recurrence part
  const title = text.slice(idx + 5).trim() || "Focus block";

  // Tokenize the left part
  const tokens = left.split(/\s+/);

  // 1) Date: YYYY-MM-DD or keywords (today/tomorrow/yesterday).
  let baseDate = null;
  for (const t of tokens) {
    const dkw = dateForKeyword(t);
    if (dkw) { baseDate = dkw; break; }
    if (isDateToken(t)) { baseDate = parseDateToken(t); break; }
  }
  if (!baseDate) baseDate = dateForKeyword("today");

  // 2) Time range (robust selection that won't grab the date token)
  const range = extractTimeRange(tokens);
  if (!range) {
    return { ok: false, error: "Provide a start-end time (e.g., 9-11 or 10:00-11:30)" };
  }
  const { startMin, endMin } = range;
  if (endMin <= startMin) {
    return { ok: false, error: "End time must be after start time" };
  }

  // 3) Recurrence (optional)
  const rec = parseRecurrence(left); // { rrule, byday? } or null

  // If it's a weekly recurrence with BYDAY but no explicit date,
  // move baseDate to the next upcoming matching day
  if (!isDateToken(tokens.find(isDateToken || (()=>false))) && rec?.byday?.length) {
    // pick the soonest next day from today
    const today = new Date(); today.setHours(0,0,0,0);
    let best = null;
    for (const code of rec.byday) {
      const candidate = nextDateForDow(code, today);
      if (!best || candidate < best) best = candidate;
    }
    if (best) baseDate = best;
  }

  const startDate = minutesToDate(baseDate, startMin);
  const endDate = minutesToDate(baseDate, endMin);

  // ISO w/o trailing 'Z' (Google treats it with provided timeZone)
  const startISO = new Date(startDate.getTime() - startDate.getMilliseconds()).toISOString().slice(0, 19);
  const endISO = new Date(endDate.getTime() - endDate.getMilliseconds()).toISOString().slice(0, 19);

  return {
    ok: true,
    data: {
      title,
      startISO,
      endISO,
      timezone: tz,
      rrule: rec?.rrule || null,
    },
  };
}
