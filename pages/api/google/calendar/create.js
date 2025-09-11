// /pages/api/google/calendar/create.js
import { requireGoogle } from "../../../../lib/googleClient";

function toDate(obj) {
  // Support dateTime (with timezone) or date (all-day)
  if (!obj) return null;
  if (obj.dateTime) return new Date(obj.dateTime);
  if (obj.date) return new Date(obj.date + "T00:00:00Z");
  return null;
}

function isoZ(isoLike) {
  // Ensure ends with Z (UTC) if it lacks timezone offset
  if (!isoLike) return isoLike;
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(isoLike)) return isoLike;
  return isoLike + "Z";
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Require Google auth
  const auth = await requireGoogle(req, res, { state: "/settings" });
  if (!auth.ok) {
    return res.status(401).json({ error: "Not connected", authUrl: auth.authUrl });
  }
  const { calendar } = auth;

  const {
    title = "Focus block",
    description = "Created via chat Focus command",
    start,
    end,
    timezone = "UTC",
    location = "Focus",
  } = req.body || {};

  if (!start || !end) {
    return res.status(400).json({ error: "Missing start or end" });
  }

  // 1) CONFLICT CHECK
  // Use list API to fetch events in the window; Calendar returns those overlapping timeMin/timeMax
  const timeMin = isoZ(start);
  const timeMax = isoZ(end);

  try {
    const list = await calendar.events.list({
      calendarId: "primary",
      singleEvents: true,
      orderBy: "startTime",
      timeMin,
      timeMax,
      maxResults: 50,
      showDeleted: false,
    });

    const existing = (list.data.items || []).filter((e) => e.status !== "cancelled");
    // Double-verify overlap (also catches boundary nuances)
    const reqStart = new Date(start + "Z");
    const reqEnd = new Date(end + "Z");

    const conflicts = existing.filter((ev) => {
      const evStart = toDate(ev.start);
      const evEnd = toDate(ev.end);
      if (!evStart || !evEnd) return false;
      return overlaps(reqStart, reqEnd, evStart, evEnd);
    });

    if (conflicts.length > 0) {
      // 409 Conflict → return compact details for UI
      return res.status(409).json({
        error: "Time conflict",
        conflicts: conflicts.map((c) => ({
          id: c.id,
          summary: c.summary || "(busy)",
          htmlLink: c.htmlLink,
          start: c.start,
          end: c.end,
          location: c.location || "",
        })),
      });
    }
  } catch (err) {
    console.error("[calendar list] error", err?.response?.data || err);
    // If list fails, we can still attempt create (but safer to surface error)
    return res.status(500).json({ error: "Failed to check conflicts" });
  }

  // 2) CREATE EVENT (after no conflicts)
  try {
    const insert = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description,
        location,
        start: { dateTime: start, timeZone: timezone },
        end: { dateTime: end, timeZone: timezone },
        reminders: {
          useDefault: true,
        },
      },
    });

    const data = insert.data || {};
    return res.status(200).json({
      id: data.id,
      htmlLink: data.htmlLink,
    });
  } catch (err) {
    console.error("[calendar insert] error", err?.response?.data || err);
    const msg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Google Calendar error";
    return res.status(500).json({ error: msg });
  }
}
