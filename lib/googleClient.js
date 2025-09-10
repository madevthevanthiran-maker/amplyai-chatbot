// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

/**
 * Least-privilege pair that covers free/busy reads + event creates/updates.
 * (You can replace with "https://www.googleapis.com/auth/calendar" for full access,
 *  but the two below are safer.)
 */
export const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI, // e.g. https://your-domain.com/api/google/oauth/callback
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  // Log once on server boot; helps diagnose missing envs on Vercel
  console.warn(
    "[googleClient] Missing env vars: GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI",
  );
}

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

/** Cookie names (HTTP-only) */
const TOK_COOKIE = "gcal_tokens_v1";

/** Read tokens from request cookies */
export function readTokensFromReq(req) {
  try {
    const parsed = cookie.parse(req.headers.cookie || "");
    if (!parsed[TOK_COOKIE]) return null;
    return JSON.parse(parsed[TOK_COOKIE]);
  } catch {
    return null;
  }
}

/** Write tokens to response cookies */
export function writeTokensToRes(res, tokens) {
  const val = JSON.stringify(tokens || {});
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", cookie.serialize(TOK_COOKIE, val, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: 60 * 60 * 24 * 30, // 30d
  }));
}

/** Clear tokens */
export function clearTokens(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", cookie.serialize(TOK_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: 0,
  }));
}

/** Build the Google consent URL. */
export function getAuthUrl(statePath = "/settings") {
  const state = encodeURIComponent(statePath);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",              // <- force re-consent to add the new scope
    include_granted_scopes: true,   // keep previously granted ones
    scope: SCOPES,
    state,
  });
}

/** Create a calendar client preloaded with tokens */
export function clientWithTokens(tokens) {
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: client });
}

/** Refresh tokens if needed; returns fresh tokens or null if not connected */
export async function ensureFreshTokens(req, res) {
  const tokens = readTokensFromReq(req);
  if (!tokens) return null;

  oauth2Client.setCredentials(tokens);

  try {
    // Force a quick refresh check – if access token is near/after expiry, get a new one
    if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60_000) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      writeTokensToRes(res, credentials);
      return credentials;
    }
    return tokens;
  } catch (err) {
    // If refresh fails (revoked), drop tokens.
    clearTokens(res);
    return null;
  }
}
