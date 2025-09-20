// /utils/parseFocus.js
// Permanent export shape fix: provide BOTH default and named exports.
// (Your existing logic can stay — the key is the export signature.)

/**
 * Minimal, dependency-free parser that handles the common phrases we support.
 * Feel free to swap in your richer logic; keep the export shape identical.
 */
export function parseFocus(input, now = new Date()) {
  const text = String(input || "").trim();
  if (!text) throw new Error("Empty input");

  // Simple patterns we support
  // 1) "next wed 14:30 call with supplier"
  // 2) "block 2-4pm tomorrow — Deep Work thesis"
  // 3) "meeting on 12/10 9am for 2 hours"
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // Helpers
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  const setTime = (d, h, m) => {
    const nd = new Date(d);
    nd.setHours(h, m, 0, 0);
    return nd;
  };
  const dayNames = ["sun","mon","tue","wed","thu","fri","sat"];

  // next <dow> <hh:mm>
  {
    const m = text.match(/next\s+(sun|mon|tue|wed|thu|fri|sat)\s+(\d{1,2})(?::|\.)(\d{2})/i);
    if (m) {
      const dow = dayNames.indexOf(m[1].toLowerCase());
      const hh = parseInt(m[2], 10);
      const mm = parseInt(m[3], 10);
      const d = new Date(now);
      const cur = d.getDay();
      let add = (dow - cur + 7) % 7;
      if (add === 0) add = 7; // next week
      d.setDate(d.getDate() + add);
      const start = setTime(d, hh, mm);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1h
      const title = text.replace(m[0], "").trim() || "Event";
      return { title, start, end, timezone: tz, allDay: false };
    }
  }

  // block 2-4pm tomorrow — Title
  {
    const m = text.match(/block\s+(\d{1,2})\s*-\s*(\d{1,2})\s*(am|pm)?\s+tomorrow(?:\s*[—-]\s*(.+))?/i);
    if (m) {
      const sH = parseInt(m[1], 10);
      const eH = parseInt(m[2], 10);
      const mer = m[3]?.toLowerCase();
      const title = (m[4] || "Focus block").trim();

      const base = new Date(now);
      base.setDate(base.getDate() + 1);
      const to24 = (h) => (mer === "pm" && h < 12 ? h + 12 : mer === "am" && h === 12 ? 0 : h);
      const start = setTime(base, to24(sH), 0);
      const end = setTime(base, to24(eH), 0);
      return { title, start, end, timezone: tz, allDay: false };
    }
  }

  // meeting on 12/10 9am for 2 hours
  {
    const m = text.match(/on\s+(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+for\s+(\d+)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)/i);
    if (m) {
      const dd = parseInt(m[1], 10);
      const MM = parseInt(m[2], 10);
      const yyyy = m[3] ? parseInt(m[3], 10) : now.getFullYear();
      let hh = parseInt(m[4], 10);
      const mm = m[5] ? parseInt(m[5], 10) : 0;
      const mer = (m[6] || "").toLowerCase();
      const qty = parseInt(m[7], 10);
      const unit = (m[8] || "").toLowerCase();

      if (mer === "pm" && hh < 12) hh += 12;
      if (mer === "am" && hh === 12) hh = 0;

      const start = new Date(yyyy, MM - 1, dd, hh, mm, 0, 0);
      const durMs =
        /hour|hr/i.test(unit) ? qty * 60 * 60 * 1000 :
        /min/i.test(unit) ? qty * 60 * 1000 :
        60 * 60 * 1000;
      const end = new Date(start.getTime() + durMs);
      const title = text.replace(m[0], "").trim() || "Meeting";
      return { title, start, end, timezone: tz, allDay: false };
    }
  }

  // fallback single all-day tomorrow: "all day tomorrow: title"
  {
    const m = text.match(/^all\s*day\s*tomorrow\s*:\s*(.+)$/i);
    if (m) {
      const t = (m[1] || "All-day").trim();
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
      return { title: t, start, end, timezone: tz, allDay: true };
    }
  }

  throw new Error("Could not parse text");
}

// IMPORTANT: keep default export too (to support default imports elsewhere)
export default parseFocus;
