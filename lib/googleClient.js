// /lib/googleClient.js
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const TOKEN_COOKIE = "amplyai_g_tokens";
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SCOPES = [
  // narrow scope: create/update events
  "https://www.googleapis.com/auth/calendar.events",
];

function required(name, val) {
  if (!val) throw new Error(`Missing required env: ${name}`);
  return val;
}

function getBaseUrl() {
  // Works on Vercel & local
  const maybe =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL ||
    process.env.SITE_URL ||
    "";
  if (!maybe) return "http://localhost:3000";
  if (maybe.startsWith("http")) return maybe;
  return `https://${maybe}`;
}

export function getRedirectUri() {
  // Keep the single callback endpoint
  return `${getBaseUrl()}/api/google/oauth/callback`;
}

function newOAuth2() {
  const clientId = required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
  const clientSecret = required(
    "GOOGLE_CLIENT_SECRET",
    process.env.GOOGLE_CLIENT_SECRET
  );
  const redirectUri = required("GOOGLE_REDIRECT_URI", getRedirectUri());

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** Build Google auth URL (optionally landing the user somewhere after) */
export function getAuthUrl(redirectTo = "/settings") {
  const o = newOAuth2();
  const url = o.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    include_granted_scopes: true,
    prompt: "consent",
    state: jwt.sign(
      { redirectTo },
      required("JWT_SECRET", process.env.JWT_SECRET || "dev_secret")
    ),
  });
  return url;
}

function serializeCookieTokens(res, tokens) {
  const value = jwt.sign(
    { tokens },
    required("JWT_SECRET", process.env.JWT_SECRET || "dev_secret")
  );
  const c = cookie.serialize(TOKEN_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: TOKEN_COOKIE_MAX_AGE,
    path: "/",
  });
  res.setHeader("Set-Cookie", c);
}

export function clearCookieTokens(res) {
  const c = cookie.serialize(TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  res.setHeader("Set-Cookie", c);
}

export function readTokensFromReq(req) {
  try {
    const parsed = cookie.parse(req.headers.cookie || "");
    if (!parsed[TOKEN_COOKIE]) return null;
    const payload = jwt.verify(
      parsed[TOKEN_COOKIE],
      required("JWT_SECRET", process.env.JWT_SECRET || "dev_secret")
    );
    return payload?.tokens || null;
  } catch {
    return null;
  }
}

/** Exchange auth code for tokens (used in callback) */
export async function exchangeCodeForTokens(code) {
  const o = newOAuth2();
  const { tokens } = await o.getToken(code);
  return tokens;
}

/** Build a ready calendar client, or null if tokens invalid */
export function clientWithTokens(tokens) {
  if (!tokens?.access_token || !tokens?.refresh_token) return null;
  const o = newOAuth2();
  o.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: o });
}

/** Ensure tokens are fresh; if expired and refreshable, refresh and persist */
export async function ensureFreshTokens(req, res) {
  const tokens = readTokensFromReq(req);
  if (!tokens) return null;

  const o = newOAuth2();
  o.setCredentials(tokens);

  try {
    // Force refreshing if needed by calling getAccessToken
    const at = await o.getAccessToken();
    // If refreshed, persist possibly updated tokens
    const current = o.credentials;
    if (current?.access_token) serializeCookieTokens(res, current);
    return current;
  } catch (err) {
    // If refresh fails, drop cookie so flow can start cleanly
    clearCookieTokens(res);
    return null;
  }
}

/** Persist tokens to cookie */
export function persistTokens(res, tokens) {
  serializeCookieTokens(res, tokens);
}
