// /lib/googleClient.js
// Minimal, production-friendly helpers for Google OAuth + Calendar.
// Uses HttpOnly cookie storage for tokens (server-side only).

import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import cookie from "cookie";

export const cookieName = "amplyai_google_tokens"; // HttpOnly; JSON of OAuth tokens

// ---------- OAuth2 Client ----------
export function makeOAuth2Client({ clientId, clientSecret, redirectUri }) {
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth env/config missing");
  }
  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });
}

// Resolve redirectUri from the incoming request host (Vercel friendly)
export function inferRedirectUri(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!host) throw new Error("Missing host");
  return `${proto}://${host}/api/google/oauth/callback`;
}

export function getEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  return { clientId, clientSecret };
}

// ---------- Cookie helpers ----------
export function getCookieSession(req) {
  const raw = req.headers.cookie || "";
  const parsed = cookie.parse(raw || "");
  if (!parsed[cookieName]) return null;
  try {
    return JSON.parse(parsed[cookieName]);
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
      secure: true,
      path: "/",
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
      secure: true,
      path: "/",
      maxAge: 0,
    })
  );
}

// Small diagnostic export to satisfy any older imports
export const diag = (..._args) => {};

// ---------- OAuth URL + token exchange ----------
export function getAuthUrl(oauth2) {
  const scopes = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar",
  ];
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
}

export async function exchangeCodeAndStore(oauth2, code, res) {
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  setCookieSession(res, tokens);
  return tokens;
}

// ---------- Calendar client ----------
export function calendarClient(oauth2) {
  return google.calendar({ version: "v3", auth: oauth2 });
}

// Ensure OAuth2 client is hydrated with cookie tokens (if any)
export function ensureOAuthWithCookie(req, _res) {
  const { clientId, clientSecret } = getEnv();
  const redirectUri = inferRedirectUri(req);
  const oauth2 = makeOAuth2Client({ clientId, clientSecret, redirectUri });

  const tokens = getCookieSession(req);
  if (tokens) oauth2.setCredentials(tokens);
  return { oauth2, hasTokens: !!tokens, redirectUri };
}

// Backward-compat names (so older files won’t break)
export const ensureCalendarClient = ensureOAuthWithCookie;
export const hydrateClientFromCookie = ensureOAuthWithCookie;
export const readGoogleTokens = getCookieSession;
