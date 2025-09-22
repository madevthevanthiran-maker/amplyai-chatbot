// /lib/googleClient.js
// Centralized Google OAuth2 + Calendar helpers used by API routes.

import { google } from "googleapis";
import cookie from "cookie";

// ----- Config -----
export const cookieName = "gcal"; // one cookie to hold token JSON

function required(name, value) {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function resolveBaseUrl() {
  // Prefer explicit base URL if provided
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  // Vercel runtime
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // Fallback for local dev
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

export function buildOAuth2Client() {
  const clientId  = required("GOOGLE_CLIENT_ID",  process.env.GOOGLE_CLIENT_ID);
  const secret    = required("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
  // callback lives at /api/google/oauth/callback
  const redirect  = `${resolveBaseUrl()}/api/google/oauth/callback`;

  return new google.auth.OAuth2(clientId, secret, redirect);
}

// ----- Cookie helpers -----
export function getCookieSession(req) {
  const raw = req.headers?.cookie || "";
  const parsed = cookie.parse(raw || "");
  const rawJson = parsed[cookieName];
  if (!rawJson) return null;

  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

export function setCookieSession(res, tokens) {
  const value = JSON.stringify(tokens || {});
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(cookieName, value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  );
}

export function clearCookieSession(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    })
  );
}

// ----- OAuth flows -----
export function getAuthUrl() {
  const oauth2 = buildOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar",
    ],
  });
}

/**
 * Exchange ?code=... for tokens and store them in the cookie.
 * Returns an OAuth2 client with credentials set.
 */
export async function exchangeCodeAndStore(req, res, code) {
  const oauth2 = buildOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  setCookieSession(res, tokens);
  return oauth2;
}

/**
 * Read tokens from cookie and hydrate an OAuth2 client.
 * Returns { oauth2, ready } where ready===true if we have valid tokens.
 */
export async function hydrateClientFromCookie(req, res) {
  const oauth2 = buildOAuth2Client();
  const tokens = getCookieSession(req);
  if (!tokens) return { oauth2, ready: false };

  oauth2.setCredentials(tokens);

  // Optionally refresh expired access token
  try {
    if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60_000) {
      const { credentials } = await oauth2.refreshAccessToken();
      oauth2.setCredentials(credentials);
      setCookieSession(res, credentials);
    }
  } catch {
    // If refresh fails, clear session so the UI can prompt to reconnect
    clearCookieSession(res);
    return { oauth2, ready: false };
  }

  return { oauth2, ready: true };
}

// ----- Calendar helpers -----
export function calendarClient(oauth2) {
  return google.calendar({ version: "v3", auth: oauth2 });
}

/**
 * Convenience: ensure we have an OAuth client & calendar instance or throw 401.
 * Useful inside API handlers.
 */
export async function ensureCalendarClient(req, res) {
  const { oauth2, ready } = await hydrateClientFromCookie(req, res);
  if (!ready) {
    res.status(401).json({
      ok: false,
      message: "Not connected",
      hint: "Open Settings → Connect Google; then refresh.",
    });
    return null;
  }
  return { oauth2, cal: calendarClient(oauth2) };
}

// ----- Diagnostics (used by /api/google/debug.js) -----
export function diag(req) {
  return {
    baseUrl: resolveBaseUrl(),
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    cookiePresent: !!getCookieSession(req),
  };
}
