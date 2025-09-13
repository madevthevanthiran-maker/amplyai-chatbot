import { google } from "googleapis";
import cookie from "cookie";
import parseFocus from "@/utils/parseFocus";

/**
 * Create Calendar Event (hardened)
 * POST body:
 *   - message?: string   (free-text; will be parsed server-side)
 *   - parsed?: { title, startISO, endISO, timezone, allDay? }  (optional, trusted from client)
 *   - tokens?: any       (ignored; we read from cookies, kept for backward compat)
 *
 * Response: { ok, parsed: { ... }, created: { id, htmlLink } }
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
    process.env.GOOGLE_REDIRECT_URI
  );
  return client;
}

function asEventResource(p) {
  if (p.allDay) {
    // Date-only (no time)
    const startDate = p.startISO.slice(0, 10);
    const endDate = p.endISO.slice(0, 10);
    return {
      summary: p.title || "Untitled",
      start: { date: startDate },
      end: { date: endDate },
    };
    } else {
    return {
      summary: p.title || "Untitled",
      start: { dateTime: p.startISO, timeZone: p.timezone || "UTC" },
      end: { dateTime: p.endISO, timeZone: p.timezone || "UTC" },
    };
  }
}

export default async function handler(req, res) {
  const reqId = `cr_${Date.now().toString(36)}_${Math.random()
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

  let parsed = null;
  try {
    if (req.body?.parsed && req.body.parsed.startISO && req.body.parsed.endISO) {
      parsed = req.body.parsed;
    } else if (typeof req.body?.message === "string" && req.body.message.trim()) {
      parsed = parseFocus(req.body.message, new Date());
    }
  } catch (e) {
    // parser failure — let’s keep going to return a clean error below
  }

  if (!parsed || !parsed.startISO || !parsed.endISO) {
    const e = err(
      400,
      "parse_failed",
      "Could not parse message into a valid time range.",
      "Try adding a date and time, e.g., 'next Wed 2:30pm'."
    );
    return res.status(e.status).json(e.body);
  }

  // Safety clamp to avoid very long events (e.g., accidental multi-day)
  const startMs = Date.parse(parsed.startISO);
  const endMs = Date.parse(parsed.endISO);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    const e = err(400, "invalid_time_range", "Parsed time range is invalid.");
    return res.status(e.status).json(e.body);
  }
  const maxDurationMs = 1000 * 60 * 60 * 24 * 14; // 14 days hard cap
  if (endMs - startMs > maxDurationMs) {
    const e = err(400, "duration_too_long", "Event duration is too long.");
    return res.status(e.status).json(e.body);
  }

  try {
    const auth = getOAuthClient();
    if (tokens.refresh_token) auth.setCredentials({ refresh_token: tokens.refresh_token });
    if (tokens.access_token) auth.setCredentials({ access_token: tokens.access_token });

    const calendar = google.calendar({ version: "v3", auth });

    const resource = asEventResource(parsed);
    const resp = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        ...resource,
        reminders: { useDefault: true },
      },
    });

    const id = resp?.data?.id || null;
    const htmlLink = resp?.data?.htmlLink || null;

    return res.status(200).json({
      ok: true,
      parsed,
      created: { id, htmlLink },
      reqId,
    });
  } catch (e) {
    const code = e?.errors?.[0]?.reason || e?.code || "google_error";
    const hint =
      code === "invalid_grant"
        ? "Token expired or revoked. Try reconnecting your Google account."
        : undefined;

    return res
      .status(502)
      .json({ ok: false, code: String(code), message: e.message || "Create failed.", hint, reqId });
  }
}
