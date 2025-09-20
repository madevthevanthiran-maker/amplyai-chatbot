// lib/googleClient.js
import cookie from "cookie";
import { google } from "googleapis";

/** Names & constants */
export const COOKIE_NAME = process.env.APP_COOKIE_NAME || "amply_google";
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/oauth/callback";

export const SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function safeDiag() {
  return {
    clientIdSet: !!CLIENT_ID,
    clientSecretSet: !!CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
    scopes: SCOPES,
  };
}

export function getOAuth() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) return null;
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl() {
  const oauth = getOAuth();
  if (!oauth) return null;
  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForTokens(code) {
  const oauth = getOAuth();
  if (!oauth) throw new Error("OAuth not configured");
  const { tokens } = await oauth.getToken(code);
  return tokens; // {access_token, refresh_token, expiry_date, id_token, ...}
}

/** Cookie helpers */
export function setAuthCookie(res, tokenObj) {
  const value = JSON.stringify(tokenObj || {});
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  );
}

export function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}

export function readAuthCookie(req) {
  const raw = req.headers.cookie || "";
  const parsed = cookie.parse(raw || "");
  const val = parsed[COOKIE_NAME];
  try {
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

/** Calendar client using stored cookie tokens */
export async function calendarClientFromCookie(req) {
  const saved = readAuthCookie(req);
  if (!saved?.access_token && !saved?.refresh_token) {
    return { ok: false, reason: "no-token" };
  }
  const oauth = getOAuth();
  oauth.setCredentials(saved);

  // Ensure non-expired access (handles refresh automatically if refresh_token exists)
  const tokenInfo = await oauth.getAccessToken().catch(() => null);

  const calendar = google.calendar({ version: "v3", auth: oauth });
  return { ok: true, oauth, calendar };
}

/** Lightweight status for UI */
export async function getStatus(req) {
  const saved = readAuthCookie(req);
  if (!saved) return { connected: false };

  const expiresIn =
    typeof saved.expiry_date === "number" ? saved.expiry_date - Date.now() : null;

  // Try to fetch the email (optional)
  let email = null;
  try {
    const oauth = getOAuth();
    oauth.setCredentials(saved);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth });
    const me = await oauth2.userinfo.get();
    email = me?.data?.email || null;
  } catch {
    // ignore, some accounts won’t return email if consent wasn’t granted
  }

  return {
    connected: true,
    expiresIn,
    email,
    scopesOk: true,
  };
}
