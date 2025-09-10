// /pages/api/google/calendar/freebusy.js
import {
  ensureFreshTokens,
  readTokensFromReq,
  clientWithTokens,
  getAuthUrl,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);
    if (!tokens) {
      return res.status(401).json({ error: "Google not connected", authUrl: getAuthUrl(req, "/settings") });
    }

    const { timeMin, timeMax, timezone } = req.body || {};
    if (!timeMin || !timeMax) {
      return res.status(400).json({ error: "Missing timeMin/timeMax" });
    }

    const calendar = clientWithTokens(req, tokens);
    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.endsWith("Z") ? timeMin : timeMin + "Z",
        timeMax: timeMax.endsWith("Z") ? timeMax : timeMax + "Z",
        items: [{ id: "primary" }],
        timeZone: timezone || "UTC",
      },
    });
    const busy = data?.calendars?.primary?.busy || [];
    res.status(200).json({ busy });
  } catch (err) {
    res.status(500).json({ error: err?.message || "freebusy failed" });
  }
}
