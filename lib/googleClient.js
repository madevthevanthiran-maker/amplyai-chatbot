// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events", // create/update events
  "https://www.googleapis.com/auth/calendar"         // read-only (free/busy, list, etc.)
];

function required(name, val) {
  if (!val) throw new Error(`Missing required env: ${name}`);
  return val;
}

const CLIENT_ID = required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
const CLIENT_SECRET = required("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
const REDIRECT_URI = required("GOOGLE_REDIRECT_URI", process.env.GOOGLE_REDIRECT_URI);

// Optional but strongly recommended (prevents preview-domain redirects)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export function oauth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl(statePath = "/settings") {
  const state = encodeURIComponent(statePath || "/");
  return oauth2Client().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    include_granted_scopes: true,
    state,
  });
}

const COOKIE_NAME = "gcal_tokens";
const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export function setTokensCookie(res, tokens) {
  const serialized = cookie.serialize(
    COOKIE_NAME,
    Buffer.from(JSON.stringify(tokens)).toString("base64"),
    cookieOptions
  );
  res.setHeader("Set-Cookie", serialized);
}

export function clearTokensCookie(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 })
  );
}

export function readTokensFromReq(req) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const raw = cookies[COOKIE_NAME];
    if (!raw) return null;
    const json = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function ensureFreshTokens(req, res) {
  const saved = readTokensFromReq(req);
  if (!saved?.access_token) return null;

  const client = oauth2Client();
  client.setCredentials(saved);

  try {
    // if still valid, just return
    if (saved.expiry_date && Date.now() < saved.expiry_date - 60_000) {
      return saved;
    }
    // otherwise refresh
    const { credentials } = await client.refreshAccessToken();
    const updated = { ...saved, ...credentials };
    setTokensCookie(res, updated);
    return updated;
  } catch {
    // refresh failed → clear cookie so we can reconnect
    clearTokensCookie(res);
    return null;
  }
}

export function calendarClient(tokens) {
  const client = oauth2Client();
  client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: client });
}
