// /pages/api/google/calendar/create.js
import { calendar, getAuthUrl, getOAuthClient } from "../../../../lib/googleClient";

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const cookies = Object.fromEntries(
    raw.split(";").map((c) => {
      const idx = c.indexOf("=");
      if (idx === -1) return [c.trim(), ""];
      return [c.slice(0, idx).trim(), decodeURIComponent(c.slice(idx + 1))];
    })
  );
  return cookies[name];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const tok = readCookie(req, "gcal_tok");
    if (!tok) {
      // Not connected → tell the client how to start auth
      const authUrl = getAuthUrl("/settings");
      return res.status(401).json({ error: "Google not connected", authUrl });
    }

    const tokens = JSON.parse(tok);
    const auth = getOAuthClient();
    auth.setCredentials(tokens);

    const { title, description, start, end, timezone, location } = req.body || {};
    if (!title || !start || !end || !timezone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const event = {
      summary: title,
      description: description || "",
      location: location || "",
      start: { dateTime: start, timeZone: timezone },
      end: { dateTime: end, timeZone: timezone },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 30 }],
      },
    };

    const resp = await calendar.events.insert({
      auth,
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 0,
    });

    return res.status(200).json({
      id: resp?.data?.id,
      htmlLink: resp?.data?.htmlLink || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
