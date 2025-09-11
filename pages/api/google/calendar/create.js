import { calendar, getOAuthClient } from "../../../../lib/googleClient";
import { getSession } from "../../../../lib/session";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = getSession(req);
  if (!session?.access_token) {
    const base = process.env.NEXT_PUBLIC_APP_URL || "";
    const authUrl = `${base}/api/google/oauth/start?state=${encodeURIComponent("/settings")}`;
    return res.status(401).json({ error: "Not connected", authUrl });
  }

  try {
    const client = getOAuthClient();
    client.setCredentials(session);

    const { title, description, start, end, timezone, location } = req.body;

    const event = {
      summary: title || "Focus",
      description: description || "Created via Planner",
      start: { dateTime: `${start}`, timeZone: timezone || "UTC" },
      end: { dateTime: `${end}`, timeZone: timezone || "UTC" },
      location: location || "Focus",
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 30 }],
      },
    };

    const created = await calendar.events.insert({
      auth: client,
      calendarId: "primary",
      requestBody: event,
    });

    res.status(200).json({ htmlLink: created.data.htmlLink || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
