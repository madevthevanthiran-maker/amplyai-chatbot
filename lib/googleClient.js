// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";
import jwt from "jsonwebtoken";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events"
];

const COOKIE_NAME = "amplyai_google";
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// IMPORTANT: lock redirect URI to a single stable base URL
const BASE_URL = process.env.PUBLIC_BASE_URL; // e.g. https://amplyai-chatbot.vercel.app
if (!BASE_URL) {
  throw new Error("Missing env PUBLIC_BASE_URL (e.g. https://your-prod-domain)");
}
const REDIRECT_URI = `${BASE_URL}/api/google/oauth/callback`;

function createOAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID) throw new Error("Missing env: GOOGLE_CLIENT_ID");
  if (!GOOGLE_CLIENT_SECRET) throw new Error("Missing env: GOOGLE_CLIENT_SECRET");

  return new google.auth.OAuth2({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: REDIRECT_URI, // <- single, stable URI
  });
}

export function getAuthUrl(returnTo = "/settings") {
  const oauth2 = createOAuthClient();
  // pack where the UI should land after callback
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64url");
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export function parseState(state) {
  try {
    const { returnTo } = JSON.parse(Buffer.from(state || "", "base64url").toString("utf8"));
    return returnTo || "/settings";
  } catch {
    return "/settings";
  }
}

export function readTokensFromReq(req) {
  try {
    const parsed = cookie.parse(req.headers.cookie || "");
    const raw = parsed[COOKIE_NAME];
    if (!raw) return null;
    return jwt.verify(raw, process.env.JWT_SECRET || "dev-secret");
  } catch {
    return null;
  }
}

export function writeTokensCookie(res, tokens) {
  const value = jwt.sign(tokens, process.env.JWT_SECRET || "dev-secret");
  res.setHeader("Set-Cookie", cookie.serialize(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: TOKEN_COOKIE_MAX_AGE,
  }));
}

export function clearTokensCookie(res) {
  res.setHeader("Set-Cookie", cookie.serialize(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  }));
}

export function clientWithTokens(tokens) {
  const oauth2 = createOAuthClient();
  oauth2.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
    scope: tokens.scope,
  });
  // Construct Calendar client properly
  const calendar = google.calendar({ version: "v3", auth: oauth2 });
  return { oauth2, calendar };
}

export async function ensureFreshTokens(req, res) {
  const saved = readTokensFromReq(req);
  if (!saved) return null;

  const { oauth2 } = clientWithTokens(saved);

  // If token still valid for > 2 minutes, reuse
  const now = Date.now();
  if (saved.expiry_date && saved.expiry_date - now > 120_000) {
    return saved;
  }

  // Refresh
  const { credentials } = await oauth2.refreshAccessToken();
  const next = {
    ...saved,
    ...credentials,
    expiry_date: credentials.expiry_date || saved.expiry_date,
  };
  writeTokensCookie(res, next);
  return next;
}
