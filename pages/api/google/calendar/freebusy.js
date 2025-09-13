import { google } from "googleapis";
import cookie from "cookie";

/**
 * Free/Busy (hardened)
 * POST body: { timeMin: ISO, timeMax: ISO, timeZone?: string, calendarId?: string }
 * Response: { busy: [{ start, end }] }
 *
 * Notes:
 * - Respects NEXT_PUBLIC_FEATURE_CALENDAR kill switch
 * - Validates input and tokens
 * - Uniform error payloads
 */

const FEATURE_CALENDAR =
  process.env.NEXT_PUBLIC_FEATURE_CALENDAR === undefined
    ? true
    : process.env.NEXT_PUBLIC_FEATURE_CALENDAR !== "false";

function err(status, code, message, hint) {
  return {
    status,
    body: { ok: false, code, message, ...(hint ? { hint } : {}) },
  };
}

function readTokens(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  // Try a few common keys we’ve used during iteration
  const candidates = [
    "gtokens",
    "google_tokens",
    "amply_google_tokens",
    "gTokens",
    "AMP_GOOGLE_TOKENS",
  ];
  for (const key of candidates) {
    if (cookies[key]) {
      try {
        return JSON.parse(cookies[key]);
      } catch {
        // some envs URL-encode cookie value
        try {
          return JSON.parse(decodeURIComponent(cookies[key]));
        } catch {}
      }
    }
  }
  return null;
}

function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // e.g. https://yourapp.com/api/google/oauth/callback
  );
  return client;
}

export default async function handler(req, res) {
  const reqId = `fb_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  if (!FEATURE_CALENDAR) {
    const e = err(
      503,
      "feature_disabled",
      "Calendar feature is disabled by admin.",
      "Set NEXT_PUBLIC_FEATURE_CALENDAR=true to enable."
    );
    return res.status(e.status).json(e.body);
  }

  if (req.method !== "POST") {
    const e = err(405, "method_not_allowed", "Use POST.");
    res.setHeader("Allow", "POST");
    return res.status(e.status).json(e.body);
  }

  const { timeMin, timeMax, timeZone, calendarId } = req.body || {};
  if (!timeMin || !timeMax) {
    const e = err(
      400,
      "invalid_input",
      "timeMin and timeMax are required ISO strings."
    );
    return res.status(e.status).json(e.body);
  }

  // Basic ISO sanity
  const t1 = Date.parse(timeMin);
  const t2 = Date.parse(timeMax);
  if (!Number.isFinite(t1) || !Number.isFinite(t2) || t2 <= t1) {
    const e = err(
      400,
      "invalid_time_range",
      "timeMin/timeMax must be valid ISO datetimes and timeMax > timeMin."
    );
    return res.status(e.status).json(e.body);
  }

  const tokens = readTokens(req);
  if (!tokens?.access_token && !tokens?.refresh_token) {
    const e = err(
      401,
      "not_connected",
      "Google account not connected.",
      "Open Settings → Connect Google."
    );
    return res.status(e.status).json(e.body);
  }

  try {
    const auth = getOAuthClient();
    if (tokens.refresh_token) auth.setCredentials({ refresh_token: tokens.refresh_token });
    if (tokens.access_token) auth.setCredentials({ access_token: tokens.access_token });

    const calendar = google.calendar({ version: "v3", auth });

    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: timeZone || "UTC",
        items: [{ id: calendarId || "primary" }],
      },
    });

    const busy = fb?.data?.calendars?.[calendarId || "primary"]?.busy || [];
    return res.status(200).json({ ok: true, busy, reqId });
  } catch (e) {
    // Normalize common Google errors
    const code = e?.errors?.[0]?.reason || e?.code || "google_error";
    const hint =
      code === "invalid_grant"
        ? "Token expired or revoked. Try reconnecting your Google account."
        : undefined;

    return res
      .status(502)
      .json({ ok: false, code: String(code), message: e.message || "FreeBusy failed.", hint, reqId });
  }
}
