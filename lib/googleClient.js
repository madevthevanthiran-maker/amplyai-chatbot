// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

const COOKIE_NAME = "gcal_oauth";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,          // e.g. https://your-app.vercel.app/api/google/oauth/callback
  NODE_ENV,
} = process.env;

function assertEnv() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI envs.");
  }
}

export const cookieName = COOKIE_NAME;

function serializeCookie(val, maxAgeSeconds) {
  return cookie.serialize(COOKIE_NAME, JSON.stringify(val || {}), {
    httpOnly: true,
    secure: NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: typeof maxAgeSeconds === "number" ? maxAgeSeconds : undefined,
  });
}

export function clearCookieSession(req, res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, "", {
      httpOnly: true,
      secure: NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
  );
}

export function getCookieSession(req, res) {
  const raw = req.headers.cookie || "";
  const parsed = cookie.parse(raw || "");
  let data = {};
  if (parsed[COOKIE_NAME]) {
    try {
      data = JSON.parse(parsed[COOKIE_NAME]);
    } catch {
      data = {};
    }
  }
  return data || {};
}

function saveSession(res, sess) {
  // expiry_date from Google is ms since epoch
  const expiresInSec =
    typeof sess.expiry_date === "number"
      ? Math.max(0, Math.floor((sess.expiry_date - Date.now()) / 1000))
      : 3600;

  res.setHeader("Set-Cookie", serializeCookie(sess, expiresInSec));
}

function newOAuth2() {
  assertEnv();
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl({ returnTo = "/settings" } = {}) {
  const oauth2 = newOAuth2();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: returnTo,
    include_granted_scopes: true,
  });
}

export async function exchangeCodeAndStore(req, res, code) {
  const oauth2 = newOAuth2();
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  // fetch email (nice to show in UI)
  const oauth2api = google.oauth2({ version: "v2", auth: oauth2 });
  let email = null;
  try {
    const me = await oauth2api.userinfo.get();
    email = me?.data?.email || null;
  } catch {}

  const scopes = Array.isArray(tokens.scope)
    ? tokens.scope
    : String(tokens.scope || "").split(" ").filter(Boolean);

  const sess = {
    access_token: tokens.access_token || null,
    refresh_token: tokens.refresh_token || null, // may be null on subsequent consents
    expiry_date: tokens.expiry_date || null,
    scopes,
    email,
  };

  saveSession(res, sess);
  return sess;
}

export async function ensureCalendarClient(req, res) {
  const sess = getCookieSession(req, res);
  if (!sess.access_token && !sess.refresh_token) {
    throw new Error("No access, refresh token, API key or refresh handler callback is set.");
  }

  const oauth2 = newOAuth2();
  oauth2.setCredentials({
    access_token: sess.access_token || undefined,
    refresh_token: sess.refresh_token || undefined,
    expiry_date: sess.expiry_date || undefined,
  });

  // Refresh if needed
  const needsRefresh =
    !sess.access_token || (typeof sess.expiry_date === "number" && sess.expiry_date <= Date.now());

  if (needsRefresh && sess.refresh_token) {
    const { credentials } = await oauth2.refreshAccessToken();
    const updated = {
      ...sess,
      access_token: credentials.access_token || sess.access_token || null,
      expiry_date: credentials.expiry_date || Date.now() + 55 * 60 * 1000,
      refresh_token: credentials.refresh_token || sess.refresh_token || null,
    };
    saveSession(res, updated);
    oauth2.setCredentials(updated);
  }

  return google.calendar({ version: "v3", auth: oauth2 });
}
