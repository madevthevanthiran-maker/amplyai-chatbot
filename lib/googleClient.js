// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar",
];

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn("[googleClient] Missing OAuth env vars.");
}

export function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  return client;
}

export function buildAuthUrl({ state = "/" } = {}) {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    include_granted_scopes: true,
    state,
  });
}

// ---- Session helpers (cookie-based minimal) ----
// Expect a cookie "gTokens" with JSON { access_token, refresh_token, expiry_date, ... }
function readTokens(req) {
  const hdr = req.headers.cookie || "";
  const c = cookie.parse(hdr || "");
  if (!c.gTokens) return null;
  try { return JSON.parse(c.gTokens); } catch { return null; }
}

export function writeTokens(res, tokens) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("gTokens", JSON.stringify(tokens), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 180, // ~6 months
      secure: process.env.NODE_ENV === "production",
    })
  );
}

export async function requireGoogle(req, res, { state = "/settings" } = {}) {
  const tokens = readTokens(req);
  if (!tokens?.access_token && !tokens?.refresh_token) {
    // not connected
    return {
      ok: false,
      authUrl: buildAuthUrl({ state }),
    };
  }

  const oauth = getOAuth2Client();
  oauth.setCredentials(tokens);

  // Refresh if needed
  try {
    if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60_000) {
      const refresh = await oauth.refreshAccessToken();
      const newTokens = { ...tokens, ...refresh.credentials };
      oauth.setCredentials(newTokens);
      writeTokens(res, newTokens);
    }
  } catch (e) {
    // force re-auth
    return {
      ok: false,
      authUrl: buildAuthUrl({ state }),
    };
  }

  const calendar = google.calendar({ version: "v3", auth: oauth });
  return { ok: true, oauth, calendar };
}
