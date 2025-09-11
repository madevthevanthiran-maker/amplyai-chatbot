// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

const {
  GOOGLE_CLIENT_ID = "",
  GOOGLE_CLIENT_SECRET = "",
  GOOGLE_REDIRECT_URI = "",
  NEXT_PUBLIC_APP_URL = "",
} = process.env;

export const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar",
];

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn(
    "[googleClient] Missing envs -> CLIENT_ID:%s SECRET:%s REDIRECT:%s",
    !!GOOGLE_CLIENT_ID,
    !!GOOGLE_CLIENT_SECRET,
    !!GOOGLE_REDIRECT_URI
  );
}
if (!/^https?:\/\/.+\/api\/google\/oauth\/callback$/.test(GOOGLE_REDIRECT_URI)) {
  console.warn("[googleClient] GOOGLE_REDIRECT_URI looks suspicious:", GOOGLE_REDIRECT_URI);
}

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
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
    maxAge: maxAge ?? 60 * 60 * 24 * 365, // 1 year
  });
}

export function setTokenCookies(res, tokens) {
  const out = [];
  if (tokens.access_token) {
    const exp =
      tokens.expiry_date ? Math.max(1, Math.floor((tokens.expiry_date - Date.now()) / 1000)) : 3600;
    out.push(serializeCookie(C_ACCESS, tokens.access_token, { maxAge: exp }));
  }
  if (tokens.refresh_token) {
    out.push(serializeCookie(C_REFRESH, tokens.refresh_token, { maxAge: 60 * 60 * 24 * 365 }));
  }
  if (tokens.expiry_date) {
    out.push(serializeCookie(C_EXP, String(tokens.expiry_date), { maxAge: 60 * 60 * 24 * 365 }));
  }
  if (out.length) res.setHeader("Set-Cookie", out);
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
  // Force the same redirect URI we registered in Google Console.
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: SCOPES,
    state,
    redirect_uri: GOOGLE_REDIRECT_URI,
  });
}

export async function exchangeCodeForTokens(code) {
  // Same redirect_uri must be provided at token exchange as well.
  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: GOOGLE_REDIRECT_URI,
  });
  oauth2Client.setCredentials(tokens);
  return { tokens };
}

export async function ensureFreshTokens(req, res) {
  const saved = readTokensFromReq(req);
  if (!saved) return null;
  oauth2Client.setCredentials(saved);
  try {
    await oauth2Client.getAccessToken(); // refresh if needed
    const creds = oauth2Client.credentials;
    setTokenCookies(res, creds);
    return creds;
  } catch (e) {
    console.error("[ensureFreshTokens] refresh failed:", e?.message);
    clearTokenCookies(res);
    return null;
  }
}

export function clientWithTokens(tokens) {
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: oauth2Client });
}

// A tiny helper to expose safe diagnostics (used by /api/google/debug)
export function safeDiag() {
  return {
    hasClientId: !!GOOGLE_CLIENT_ID,
    hasClientSecret: !!GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
    appUrl: NEXT_PUBLIC_APP_URL || "(none)",
  };
}
