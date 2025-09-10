// /pages/api/google/calendar/freebusy.js
import {
  ensureFreshTokens,
  readTokensFromReq,
  clientWithTokens,
  getAuthUrl,
} from "../../../../lib/googleClient";

/**
 * POST body:
 * { start: "YYYY-MM-DDTHH:mm:ss", end: "YYYY-MM-DDTHH:mm:ss", timezone?: "Area/City" }
 *
 * Returns busy slots in the requested range, pulled from the primary calendar.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);

    if (!tokens) {
      return res.status(401).json({
        error: "Google not connected",
        authUrl: getAuthUrl("/settings"),
      });
    }

    const { start, end, timezone } = req.body || {};
    if (!start || !end) {
      return res.status(400).json({ error: "Missing start or end" });
    }

    const calendar = clientWithTokens(tokens);

    const { data } = await calendar.freebusy.query({
      requestBody: {
        timeMin: start + "Z", // safe default; adjust if you pass explicit tz
        timeMax: end + "Z",
        timeZone: timezone || "UTC",
        items: [{ id: "primary" }],
      },
    });

    const busy = data?.calendars?.primary?.busy || [];
    return res.status(200).json({ busy });
  } catch (err) {
    console.error("Freebusy error:", err?.response?.data || err);
    return res.status(500).json({
      error:
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to fetch availability",
    });
  }
}
