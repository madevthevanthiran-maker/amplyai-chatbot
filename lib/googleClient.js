import { google } from "googleapis";
import cookie from "cookie";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_SCOPES,
  APP_COOKIE_NAME = "amply_google",
} = process.env;

// Scopes we need; allow override by env
const DEFAULT_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function buildOAuth2() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing Google OAuth env vars");
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl() {
  const o = buildOAuth2();
  const scopes = (GOOGLE_SCOPES ? GOOGLE_SCOPES.split(",") : DEFAULT_SCOPES).map(s => s.trim());
  return o.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: scopes,
  });
}

// Exchange code for tokens and set cookie
export async function exchangeCodeAndSetCookie(req, res) {
  const { code } = req.query;
  if (!code) throw new Error("Missing code");

  const o = buildOAuth2();
  const { tokens } = await o.getToken(code);

  // Persist refresh_token only (secure cookie); access token is short-lived
  const payload = {
    refresh_token: tokens.refresh_token || null,
    obtained_at: Date.now(),
  };

  res.setHeader("Set-Cookie", cookie.serialize(APP_COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1y
  }));

  return payload;
}

function readCookie(req) {
  const h = req.headers.cookie || "";
  const parsed = cookie.parse(h || "");
  if (!parsed[APP_COOKIE_NAME]) return null;
  try {
    return JSON.parse(parsed[APP_COOKIE_NAME]);
  } catch {
    return null;
  }
}

export async function calendarClientFromCookie(req) {
  const c = readCookie(req);
  if (!c?.refresh_token) {
    return { ok: false, reason: "No refresh token" };
  }
  const o = buildOAuth2();
  o.setCredentials({ refresh_token: c.refresh_token });
  const cal = google.calendar({ version: "v3", auth: o });
  return { ok: true, oauth: o, calendar: cal };
}

export function safeDiag() {
  return {
    hasClientId: !!GOOGLE_CLIENT_ID,
    hasClientSecret: !!GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI || null,
    scopes: GOOGLE_SCOPES || DEFAULT_SCOPES.join(","),
  };
}
