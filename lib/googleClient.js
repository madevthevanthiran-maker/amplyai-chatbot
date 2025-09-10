// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";
import crypto from "crypto";

const BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/google/oauth/callback`;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events" // create/update events only
];

// --- Cookie helpers ---
const COOKIE_NAME = "g_tokens";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "dev-secret";

function sign(data) {
  return crypto.createHmac("sha256", COOKIE_SECRET).update(data).digest("hex");
}

export function setTokensCookie(res, tokens) {
  const payload = JSON.stringify(tokens || {});
  const value = Buffer.from(payload, "utf8").toString("base64");
  const signature = sign(value);
  const serialized = cookie.serialize(COOKIE_NAME, `${value}.${signature}`, {
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  res.setHeader("Set-Cookie", serialized);
}

export function clearTokensCookie(res) {
  const serialized = cookie.serialize(COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    secure: true,
    sameSite: "lax",
    expires: new Date(0),
  });
  res.setHeader("Set-Cookie", serialized);
}

export function readTokensFromReq(req) {
  const hdr = req.headers.cookie || "";
  const cookies = cookie.parse(hdr);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  const [value, sig] = raw.split(".");
  if (!value || !sig) return null;
  if (sign(value) !== sig) return null;
  try {
    const json = Buffer.from(value, "base64").toString("utf8");
    const obj = JSON.parse(json);
    return obj || null;
  } catch {
    return null;
  }
}

// --- Google OAuth client ---
export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

export function getAuthUrl(returnTo = "/settings") {
  const oauth2Client = getOAuthClient();
  const state = encodeURIComponent(returnTo);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
}

export async function exchangeCodeForTokens(code) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function ensureFreshTokens(req, res) {
  const tokens = readTokensFromReq(req);
  if (!tokens?.access_token) return null;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokens);

  // Auto refresh if needed
  try {
    const maybeRefreshed = await oauth2Client.getAccessToken();
    if (maybeRefreshed && maybeRefreshed.token) {
      const fresh = oauth2Client.credentials;
      setTokensCookie(res, fresh);
      return fresh;
    }
  } catch {
    // If refresh fails, wipe cookie so caller can re-auth
    clearTokensCookie(res);
    return null;
  }

  return oauth2Client.credentials;
}

export function calendarClientWithTokens(tokens) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: oauth2Client });
}
