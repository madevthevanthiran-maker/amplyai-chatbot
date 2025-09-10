// /lib/googleClient.js
import { google } from "googleapis";

/** ---------- Simple cookie helpers (no dependency) ---------- */
function getCookie(req, name) {
  const raw = req?.headers?.cookie || "";
  if (!raw) return undefined;
  const map = Object.fromEntries(
    raw.split(";")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const i = s.indexOf("=");
        return i === -1 ? [s, ""] : [s.slice(0, i), decodeURIComponent(s.slice(i + 1))];
      })
  );
  return map[name];
}

function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.httpOnly) parts.push(`HttpOnly`);
  if (options.secure) parts.push(`Secure`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  parts.push(`Path=/`);
  res.setHeader("Set-Cookie", parts.join("; "));
}

/** ---------- Absolute base URL ---------- */
export function getBaseUrl(req) {
  // Prefer NEXT_PUBLIC_APP_URL for stability across preview/prod
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  // Fallback: infer from current request
  const proto = (req?.headers?.["x-forwarded-proto"] || "https").split(",")[0];
  const host = (req?.headers?.host || "").split(",")[0];
  return `${proto}://${host}`;
}

/** ---------- OAuth Client ---------- */
function getOAuthClient(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${getBaseUrl(req)}/api/google/oauth/callback`;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/** ---------- Scopes ---------- */
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events", // create / edit events
];

/** Build a user-visible connect URL (absolute). */
export function getAuthUrl(req, statePath = "/settings") {
  const oauth2Client = getOAuthClient(req);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: statePath,
  });
}

/** ---------- Tokens in cookie ---------- */
const TOK_COOKIE = "g_tokens"; // contains JSON string of tokens

export function readTokensFromReq(req) {
  try {
    const raw = getCookie(req, TOK_COOKIE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setTokensCookie(res, tokens) {
  // Keep for ~30 days; Google tokens contain expiry_date too
  setCookie(res, TOK_COOKIE, JSON.stringify(tokens), {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearTokensCookie(res) {
  setCookie(res, TOK_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 0,
  });
}

/** ---------- Ensure fresh tokens ---------- */
export async function ensureFreshTokens(req, res) {
  const tokens = readTokensFromReq(req);
  if (!tokens?.access_token) return null;

  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(tokens);

  // If within 2 minutes of expiry, refresh
  const now = Date.now();
  const exp = tokens.expiry_date ? Number(tokens.expiry_date) : 0;
  if (!exp || exp - now < 2 * 60 * 1000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      setTokensCookie(res, credentials);
      return credentials;
    } catch (err) {
      // Refresh failed; clean cookie and force reconnect
      clearTokensCookie(res);
      return null;
    }
  }
  return tokens;
}

/** Calendar client */
export function clientWithTokens(req, tokens) {
  const oauth2Client = getOAuthClient(req);
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: oauth2Client });
}
