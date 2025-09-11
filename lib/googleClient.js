// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

const {
  GOOGLE_CLIENT_ID = "",
  GOOGLE_CLIENT_SECRET = "",
  GOOGLE_REDIRECT_URI = "",
  NEXT_PUBLIC_APP_URL = "",
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn(
    "[googleClient] Missing envs. clientId? %s  secret? %s  redirect? %s",
    !!GOOGLE_CLIENT_ID,
    !!GOOGLE_CLIENT_SECRET,
    !!GOOGLE_REDIRECT_URI
  );
}

export const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar",
];

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI // must exactly match in Google Console
);

// ---------- Cookie helpers ----------
const C_ACCESS = "g_access";
const C_REFRESH = "g_refresh";
const C_EXP = "g_exp";

function serializeCookie(name, value, { maxAge } = {}) {
  return cookie.serialize(name, value || "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: maxAge ?? 60 * 60 * 24 * 365, // 1y
  });
}

export function setTokenCookies(res, tokens) {
  const cookies = [];

  if (tokens.access_token) {
    const expSeconds =
      tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600;
    cookies.push(serializeCookie(C_ACCESS, tokens.access_token, { maxAge: expSeconds }));
  }

  if (tokens.refresh_token) {
    cookies.push(serializeCookie(C_REFRESH, tokens.refresh_token, { maxAge: 60 * 60 * 24 * 365 }));
  }

  if (tokens.expiry_date) {
    cookies.push(serializeCookie(C_EXP, String(tokens.expiry_date), { maxAge: 60 * 60 * 24 * 365 }));
  }

  if (cookies.length) res.setHeader("Set-Cookie", cookies);
}

export function readTokensFromReq(req) {
  const parsed = cookie.parse(req.headers.cookie || "");
  const access_token = parsed[C_ACCESS];
  const refresh_token = parsed[C_REFRESH];
  const expiry_date = parsed[C_EXP] ? Number(parsed[C_EXP]) : undefined;

  if (!access_token && !refresh_token) return null;
  return { access_token, refresh_token, expiry_date };
}

export function clearTokenCookies(res) {
  res.setHeader("Set-Cookie", [
    serializeCookie(C_ACCESS, "", { maxAge: 0 }),
    serializeCookie(C_REFRESH, "", { maxAge: 0 }),
    serializeCookie(C_EXP, "", { maxAge: 0 }),
  ]);
}

// ---------- OAuth helpers ----------
export function getAuthUrl(state = "/settings") {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: SCOPES,
    state,
    // Some libs ignore this option; constructor already set it, but pass anyway:
    redirect_uri: GOOGLE_REDIRECT_URI,
  });
  return url;
}

export async function exchangeCodeForTokens(code) {
  // IMPORTANT: pass redirect_uri to avoid “invalid_grant” if server differs
  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: GOOGLE_REDIRECT_URI,
  });
  oauth2Client.setCredentials(tokens);
  return { tokens };
}

export async function ensureFreshTokens(req, res) {
  const fromCookies = readTokensFromReq(req);
  if (!fromCookies) return null;

  oauth2Client.setCredentials(fromCookies);

  try {
    // This call refreshes using refresh_token when needed
    await oauth2Client.getAccessToken();
    const creds = oauth2Client.credentials;
    setTokenCookies(res, creds);
    return creds;
  } catch (e) {
    console.error("[ensureFreshTokens] failed to refresh:", e?.message);
    clearTokenCookies(res);
    return null;
  }
}

export function clientWithTokens(tokens) {
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: oauth2Client });
}
