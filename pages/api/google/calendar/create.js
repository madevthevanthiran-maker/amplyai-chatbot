// /pages/api/google/calendar/create.js
import { google } from "googleapis";
import { readGoogleTokens } from "@/lib/googleCookie";
import parseFocus from "@/utils/parseFocus";

const FEATURE_CALENDAR =
  process.env.NEXT_PUBLIC_FEATURE_CALENDAR === undefined
    ? true
    : process.env.NEXT_PUBLIC_FEATURE_CALENDAR !== "false";

function fail(res, status, code, message, hint) {
  return res.status(status).json({ ok: false, code, message, ...(hint ? { hint } : {}) });
}

function toEventResource(p) {
  if (p.allDay) {
    return {
      summary: p.title || "Untitled",
      start: { date: p.startISO.slice(0, 10) },
      end: { date: p.endISO.slice(0, 10) },
    };
  }
  return {
    summary: p.title || "Untitled",
    start: { dateTime: p.startISO, timeZone: p.timezone || "UTC" },
    end: { dateTime: p.endISO, timeZone: p.timezone || "UTC" },
  };
}

export default async function handler(req, res) {
  const reqId = `cr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  if (!FEATURE_CALENDAR) {
    return fail(res, 503, "feature_disabled", "Calendar feature is disabled by admin.");
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(res, 405, "method_not_allowed", "Use POST.");
  }

  const tokens = readGoogleTokens(req);
  if (!tokens?.access_token && !tokens?.refresh_token) {
    return fail(res, 401, "not_connected", "Google account not connected.");
  }

  let parsed = null;
  try {
    if (req.body?.parsed?.startISO && req.body?.parsed?.endISO) {
      parsed = req.body.parsed;
    } else if (typeof req.body?.message === "string" && req.body.message.trim()) {
      parsed = parseFocus(req.body.message, new Date());
    }
  } catch {}

  if (!parsed?.startISO || !parsed?.endISO) {
    return fail(
      res,
      400,
      "parse_failed",
      "Could not parse message into a valid time range.",
      "Try 'next Wed 2:30pm' or 'tomorrow 2-4pm — focus block'."
    );
  }

  const start = Date.parse(parsed.startISO);
  const end = Date.parse(parsed.endISO);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return fail(res, 400, "invalid_time_range", "Parsed time range is invalid.");
  }
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;
  if (end - start > twoWeeks) {
    return fail(res, 400, "duration_too_long", "Event duration is too long (limit 14 days).");
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
    const resource = toEventResource(parsed);

    const resp = await calendar.events.insert({
      calendarId: "primary",
      requestBody: { ...resource, reminders: { useDefault: true } },
    });

    return res.status(200).json({
      ok: true,
      parsed,
      created: {
        id: resp?.data?.id || null,
        htmlLink: resp?.data?.htmlLink || null,
      },
      reqId,
    });
  } catch (e) {
    const code = e?.errors?.[0]?.reason || e?.code || "google_error";
    const hint =
      code === "invalid_grant"
        ? "Token expired or revoked. Reconnect Google in Settings."
        : undefined;
    return res.status(502).json({
      ok: false,
      code: String(code),
      message: e.message || "Create failed.",
      hint,
      reqId,
    });
  }
}
