// /lib/googleClient.js
// Permanent, centralized Google OAuth utilities for server-side use in Next.js.
// Exposes *named* exports used by API routes, plus a small status/diagnostic helper.

import { google } from "googleapis";
import cookie from "cookie";

// ---- Env ----
const {
  GOOGLE_CLIENT_ID = "",
  GOOGLE_CLIENT_SECRET = "",
  GOOGLE_REDIRECT_URI = "",
  GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
  // Cookie settings
  GOOGLE_COOKIE_NAME = "amply.gcal",
  COOKIE_DOMAIN, // optional (let Next set default domain if omitted)
  NODE_ENV,
} = process.env;

const isProd = NODE_ENV === "production";

// ---- Helpers ----
function requiredEnv() {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI);
}

export function safeDiag() {
  return {
    clientIdPresent: !!GOOGLE_CLIENT_ID,
    clientSecretPresent: !!GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI || "(missing)",
    scopes: GOOGLE_SCOPES,
    cookieName: GOOGLE_COOKIE_NAME,
  };
}

export function getOAuthClient() {
  if (!requiredEnv()) {
    throw new Error("Missing GOOGLE_CLIENT_ID / SECRET / REDIRECT_URI");
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state = "") {
  const oauth2Client = getOAuthClient();
  const scopes = (GOOGLE_SCOPES || "").split(/\s+/).filter(Boolean);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
    include_granted_scopes: true,
  });
}

// ---- Cookie (server only) ----
function setCookie(res, name, value, maxAgeSec) {
  const serialized = cookie.serialize(name, value, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    ...(maxAgeSec ? { maxAge: maxAgeSec } : {}),
  });
  res.setHeader("Set-Cookie", serialized);
}

function clearCookie(res, name) {
  const serialized = cookie.serialize(name, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", serialized);
}

export function readTokenCookie(req) {
  try {
    const parsed = cookie.parse(req.headers.cookie || "");
    const raw = parsed[GOOGLE_COOKIE_NAME];
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeTokenCookie(res, tokens) {
  // Store only what we need
  const store = JSON.stringify({
    access_token: tokens.access_token || null,
    refresh_token: tokens.refresh_token || null,
    expiry_date: tokens.expiry_date || null,
    token_type: tokens.token_type || "Bearer",
    scope: tokens.scope || GOOGLE_SCOPES,
  });
  // 30 days
  setCookie(res, GOOGLE_COOKIE_NAME, store, 60 * 60 * 24 * 30);
}

export function clearTokenCookie(res) {
  clearCookie(res, GOOGLE_COOKIE_NAME);
}

// ---- Tokens & client hydration ----
export async function setTokensOnClient(oauth2Client, tokens) {
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

export async function hydrateClientFromCookie(req) {
  const oauth2Client = getOAuthClient();
  const fromCookie = readTokenCookie(req);
  if (!fromCookie) return { oauth2Client, ok: false, reason: "no-cookie" };

  oauth2Client.setCredentials(fromCookie);
  return { oauth2Client, ok: true, reason: "cookie" };
}

export async function ensureAccessToken(req, res) {
  const { oauth2Client, ok } = await hydrateClientFromCookie(req);
  if (!ok) return { ok: false, error: "No cookie tokens" };

  // refresh if needed
  let creds = oauth2Client.credentials;
  const needsRefresh =
    !creds.access_token ||
    (creds.expiry_date && Date.now() >= creds.expiry_date - 60_000);

  if (needsRefresh) {
    if (!creds.refresh_token) {
      return { ok: false, error: "No refresh token present" };
    }
    const { credentials } = await oauth2Client.refreshAccessToken();
    creds = credentials;
    writeTokenCookie(res, creds);
    oauth2Client.setCredentials(creds);
  }

  return { ok: true, oauth2Client };
}

// ---- Status for UI ----
export async function status(req) {
  try {
    const c = readTokenCookie(req);
    if (!c) return { connected: false, reason: "no-cookie" };
    const hasRefresh = !!c.refresh_token;
    const hasAccess = !!c.access_token && !!c.expiry_date && Date.now() < c.expiry_date;
    return {
      connected: hasRefresh || hasAccess,
      hasRefresh,
      hasAccess,
      expiry_date: c.expiry_date || null,
      scope: c.scope || null,
    };
  } catch {
    return { connected: false, reason: "parse-failed" };
  }
}

// ---- Revoke ----
export async function revokeFromCookie(req, res) {
  const { oauth2Client, ok } = await hydrateClientFromCookie(req);
  if (!ok) {
    clearTokenCookie(res);
    return { ok: true, didRevoke: false, reason: "no-cookie" };
  }
  try {
    const token = oauth2Client.credentials.access_token || oauth2Client.credentials.refresh_token;
    if (token) await oauth2Client.revokeToken(token);
  } catch {
    // ignore
  }
  clearTokenCookie(res);
  return { ok: true, didRevoke: true };
}
