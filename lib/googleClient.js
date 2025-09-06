// /lib/googleClient.js
// Centralizes Google OAuth setup and token storage for Calendar event creation.
// Uses googleapis and a signed HTTP-only cookie to persist tokens per user session.
//
// ENV required:
// - GOOGLE_CLIENT_ID
// - GOOGLE_CLIENT_SECRET
// - GOOGLE_REDIRECT_URI  (e.g., https://yourdomain.com/api/google/oauth/callback)
// - APP_SECRET           (any strong random string for signing the cookie)
//
// Install:
//   npm i googleapis jsonwebtoken cookie
//
// This helper is consumed by API routes (start OAuth, callback, createEvent).

import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { serialize, parse } from "cookie";

const TOKEN_COOKIE = "gc_auth";
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events" // create/update events
];

function required(name, val) {
  if (!val) {
    throw new Error(`Missing required env: ${name}`);
  }
  return val;
}

export function getOAuth2Client() {
  const clientId = required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
  const clientSecret = required("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
  const redirectUri = required("GOOGLE_REDIRECT_URI", process.env.GOOGLE_REDIRECT_URI);

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate the Google consent screen URL
export function getAuthUrl(state = "") {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state
  });
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  // tokens: { access_token, refresh_token, expiry_date, id_token, scope, token_type }
  return tokens;
}

// Attach tokens to a Google client for API calls
export function clientWithTokens(tokens) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: oauth2Client });
}

// ---------- Cookie-based token storage (signed) ----------

function signTokenPayload(payload) {
  const secret = required("APP_SECRET", process.env.APP_SECRET);
  // Keep it lean; do NOT store giant objects
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: "30d" });
}

function verifyTokenCookie(cookieVal) {
  if (!cookieVal) return null;
  const secret = required("APP_SECRET", process.env.APP_SECRET);
  try {
    return jwt.verify(cookieVal, secret, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}

export function readTokensFromReq(req) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const packed = cookies[TOKEN_COOKIE];
  const decoded = verifyTokenCookie(packed);
  if (!decoded) return null;

  // Minimal sanity
  const {
    access_token,
    refresh_token,
    expiry_date,
    scope,
    token_type,
    id_token
  } = decoded;
  return {
    access_token,
    refresh_token,
    expiry_date,
    scope,
    token_type,
    id_token
  };
}

export function writeTokensToRes(res, tokens) {
  const packed = signTokenPayload({
    // only store essentials
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    scope: tokens.scope,
    token_type: tokens.token_type,
    id_token: tokens.id_token
  });

  const cookie = serialize(TOKEN_COOKIE, packed, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_COOKIE_MAX_AGE
  });
  res.setHeader("Set-Cookie", cookie);
}

export function clearTokens(res) {
  const cookie = serialize(TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  res.setHeader("Set-Cookie", cookie);
}

// Refresh tokens if expired and we have a refresh_token
export async function ensureFreshTokens(req, res) {
  const tokens = readTokensFromReq(req);
  if (!tokens) return null;

  const now = Date.now();
  if (tokens.expiry_date && now < tokens.expiry_date - 60_000) {
    // Not expired (keep 60s buffer)
    return tokens;
  }

  if (!tokens.refresh_token) {
    // Can't refresh; treat as missing
    return null;
  }

  // Refresh via OAuth2 client
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
  const { credentials } = await oauth2Client.refreshAccessToken();

  // Persist new tokens
  writeTokensToRes(res, {
    ...tokens,
    ...credentials
  });

  return {
    ...tokens,
    ...credentials
  };
}
