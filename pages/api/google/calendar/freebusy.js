// /pages/api/google/calendar/freebusy.js
import { google } from "googleapis";
import { readGoogleTokens } from "@/lib/googleCookie";

const FEATURE_CALENDAR =
  process.env.NEXT_PUBLIC_FEATURE_CALENDAR === undefined
    ? true
    : process.env.NEXT_PUBLIC_FEATURE_CALENDAR !== "false";

function fail(res, status, code, message, hint) {
  return res.status(status).json({ ok: false, code, message, ...(hint ? { hint } : {}) });
}

export default async function handler(req, res) {
  const reqId = `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  if (!FEATURE_CALENDAR) {
    return fail(res, 503, "feature_disabled", "Calendar feature is disabled by admin.");
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(res, 405, "method_not_allowed", "Use POST.");
  }

  const { timeMin, timeMax, timeZone, calendarId } = req.body || {};
  if (!timeMin || !timeMax) {
    return fail(res, 400, "invalid_input", "timeMin and timeMax are required ISO strings.");
  }

  const t1 = Date.parse(timeMin);
  const t2 = Date.parse(timeMax);
  if (!Number.isFinite(t1) || !Number.isFinite(t2) || t2 <= t1) {
    return fail(res, 400, "invalid_time_range", "timeMax must be after timeMin.");
  }

  const tokens = readGoogleTokens(req);
  if (!tokens?.access_token && !tokens?.refresh_token) {
    return fail(res, 401, "not_connected", "Google account not connected.");
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
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
    const code = e?.errors?.[0]?.reason || e?.code || "google_error";
    const hint =
      code === "invalid_grant"
        ? "Token expired or revoked. Reconnect Google in Settings."
        : undefined;
    return res.status(502).json({
      ok: false,
      code: String(code),
      message: e.message || "FreeBusy failed.",
      hint,
      reqId,
    });
  }
}
