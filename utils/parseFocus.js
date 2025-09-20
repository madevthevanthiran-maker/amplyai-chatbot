// utils/parseFocus.js
//
// Robust natural-language parser for calendar-ish prompts.
// No external deps. Handles relative dates ("tomorrow", "next wed"),
// explicit dates (DD/MM[/YYYY] or YYYY-MM-DD), time ranges ("2-4pm"),
// single times + duration ("9am for 2 hours"), 24h times, and titles after "—".
//
// Usage: const out = parseFocus("block 2-4pm tomorrow — Deep Work thesis", new Date(), "Asia/Singapore")
// Returns: { ok: true, parsed: { title, startISO, endISO, timezone } }  OR  { ok:false, message }

const WD = ["sun","mon","tue","wed","thu","fri","sat"];

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// Make a date in a given timezone keeping local wall clock by offset math
function toZonedISO(d, tz) {
  try {
    // Use Intl to get parts then rebuild ISO in that TZ
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
    const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
    const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
    return new Date(iso + "Z"); // make Date from UTC-ish string; we only need ISO later
  } catch {
    return d; // fallback
  }
}

function dateAtLocal(tz, year, monthIndex, day, hh=0, mm=0) {
  // Build local-meaningful time by formatting to string in tz
  const d = new Date(Date.UTC(year, monthIndex, day, hh, mm, 0));
  return toZonedISO(d, tz);
}

function nextWeekday(base, targetDow, includeToday=false) {
  const bd = new Date(base);
  const diff = (targetDow - bd.getDay() + 7) % 7;
  const add = diff === 0 && !includeToday ? 7 : diff;
  bd.setDate(bd.getDate() + add);
  return bd;
}

function parseExplicitDate(token) {
  // Supports DD/MM(/YYYY), D-M, YYYY-MM-DD
  let m;
  if ((m = token.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) {
    const y = +m[1], mo = clamp(+m[2],1,12)-1, d = clamp(+m[3],1,31);
    return { y, mo, d };
  }
  if ((m = token.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/))) {
    // Assume DD/MM in SG/AU style; if day <=12 and month >12 we'd still treat DD/MM
    const d = +m[1], mo = +m[2], y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear();
    return { y, mo: clamp(mo,1,12)-1, d: clamp(d,1,31) };
  }
  return null;
}

function parseDuration(s) {
  const m = s.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("h")) return Math.round(n*60);
  return Math.round(n); // minutes
}

function parseTimespan(text) {
  // Accept: "2-4pm", "2pm-4pm", "14:00-16:00", "14-16", "9:15-10", "9am–11am"
  const dash = "[\\-–—]";
  const tm = "([01]?\\d|2[0-3])(?::([0-5]\\d))?";
  const ampm = "\\s*(am|pm)?";
  const re = new RegExp(`\\b${tm}${ampm}\\s*${dash}\\s*${tm}${ampm}\\b`, "i");
  const m = text.match(re);
  if (!m) return null;

  let sh = +m[1], sm = m[2] ? +m[2] : 0, sap = (m[3]||"").toLowerCase();
  let eh = +m[4], em = m[5] ? +m[5] : 0, eap = (m[6]||"").toLowerCase();

  if (sap) { // normalize 12-hour
    if (sap === "pm" && sh < 12) sh += 12;
    if (sap === "am" && sh === 12) sh = 0;
  }
  if (eap) {
    if (eap === "pm" && eh < 12) eh += 12;
    if (eap === "am" && eh === 12) eh = 0;
  }
  // If only end has am/pm (e.g., "2-4pm"), infer start by mirroring period
  if (!sap && eap) {
    if (eap === "pm" && sh < 12) sh += 12;
    if (eap === "am" && sh === 12) sh = 0;
  }
  return { sh, sm, eh, em, matchText: m[0] };
}

function parseSingleTime(text) {
  // Accept "14:30", "9", "9am", "9:15pm"
  const m = text.match(/\b([01]?\d|2[0-3])(?::([0-5]\d))?\s*(am|pm)?\b/i);
  if (!m) return null;
  let h = +m[1], min = m[2] ? +m[2] : 0, ap = (m[3]||"").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return { h, min, matchText: m[0] };
}

function extractTitle(input, removedSpans) {
  // If user used an em dash "—" (or hyphen) as title separator, prefer text after it
  const dashIdx = input.indexOf("—");
  if (dashIdx >= 0 && dashIdx < input.length - 1) {
    const t = input.slice(dashIdx + 1).trim();
    if (t) return t;
  }
  // Remove matched date/time snippets from the string, use remainder as title
  let s = input;
  removedSpans.forEach(txt => { s = s.replace(txt, " "); });
  // scrub common keywords
  s = s
    .replace(/\b(block|meeting|call|on|at|from|to|until|tmr|tomorrow|today|next|this|mon|tue|wed|thu|fri|sat|sun|am|pm|for)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return s || "Calendar item";
}

export default function parseFocus(input, now = new Date(), timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC") {
  try {
    const text = String(input).trim();
    if (!text) return { ok: false, message: "Empty input" };

    const lower = text.toLowerCase();

    // 1) Date detection
    let targetDate = null;
    // today / tomorrow
    if (/\btoday\b/i.test(lower)) {
      targetDate = new Date(now);
    } else if (/\b(tmr|tomorrow)\b/i.test(lower)) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      // next/this weekday
      const mwd = lower.match(/\b(next|this)\s+(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)\b/);
      if (mwd) {
        const which = mwd[1]; let wd = mwd[2].slice(0,3); if (wd === "tue") wd = "tue";
        const dow = WD.indexOf(wd);
        targetDate = which === "this" ? nextWeekday(now, dow, true) : nextWeekday(now, dow, false);
      }
    }

    // explicit date token present?
    if (!targetDate) {
      const md = lower.match(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\b/);
      if (md) {
        const ed = parseExplicitDate(md[1]);
        if (ed) targetDate = new Date(ed.y, ed.mo, ed.d);
      }
    }

    // default date = today if still not found and we do have a time
    let hadTime = false;

    // 2) Time detection (range, single+duration, single)
    const removed = [];
    let sh=9, sm=0, eh=10, em=0; // defaults if single time without duration

    const span = parseTimespan(lower);
    if (span) {
      hadTime = true;
      ({sh,sm,eh,em} = span);
      removed.push(span.matchText);
    } else {
      const durMin = parseDuration(lower);
      const st = parseSingleTime(lower);
      if (st) {
        hadTime = true;
        sh = st.h; sm = st.min;
        removed.push(st.matchText);
        if (durMin && durMin > 0) {
          const total = sh*60 + sm + durMin;
          eh = Math.floor(total/60); em = total % 60;
          removed.push((lower.match(/\bfor\s+\d+(?:\.\d+)?\s*(?:h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/i)||[""])[0]);
        } else {
          // default 60 min if no explicit duration
          const total = sh*60 + sm + 60;
          eh = Math.floor(total/60); em = total % 60;
        }
      } else if (/\ball[-\s]?day\b/i.test(lower)) {
        hadTime = true;
        sh = 0; sm = 0; eh = 23; em = 59;
        removed.push((lower.match(/\ball[-\s]?day\b/i) || [""])[0]);
      }
    }

    // If we never saw a date:
    if (!targetDate) {
      if (!hadTime) {
        return { ok: false, message: "Couldn't find a date or time in your text." };
      }
      // default to today if time is present
      targetDate = new Date(now);
    }

    // Build start/end in the requested timezone
    const y = targetDate.getFullYear();
    const mo = targetDate.getMonth();
    const d = targetDate.getDate();

    const startLocal = dateAtLocal(timezone, y, mo, d, sh, sm);
    const endLocal   = dateAtLocal(timezone, y, mo, d, eh, em);

    // 3) Title extraction
    // Add common date/time snippets to removed for cleaner title
    const dateToken = lower.match(/\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|today|tomorrow|tmr|(next|this)\s+(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat))\b/i);
    if (dateToken) removed.push(dateToken[0]);
    const title = extractTitle(text, removed);

    return {
      ok: true,
      parsed: {
        title,
        startISO: new Date(startLocal.getTime() - startLocal.getTimezoneOffset()*60000).toISOString(),
        endISO:   new Date(endLocal.getTime()   - endLocal.getTimezoneOffset()*60000).toISOString(),
        timezone
      }
    };
  } catch (e) {
    return { ok: false, message: `Parse failed: ${e.message || e}` };
  }
}
