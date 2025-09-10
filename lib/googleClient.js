// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  NEXT_PUBLIC_APP_URL,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn("[googleClient] Missing Google OAuth env vars");
}

const TOKEN_COOKIE = "ga_tok";
const RT_COOKIE = "ga_rtok";
const EXP_COOKIE = "ga_exp";

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state = "/settings") {
  const oauth2Client = getOAuth2Client();
  const scopes = ["https://www.googleapis.com/auth/calendar.events"];
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });
}

function serializeAuthCookies({ access_token, refresh_token, expiry_date }) {
  const cookies = [];
  if (access_token) {
    cookies.push(
      cookie.serialize(TOKEN_COOKIE, access_token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60,
      })
    );
  }
  if (refresh_token) {
    cookies.push(
      cookie.serialize(RT_COOKIE, refresh_token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 180,
      })
    );
  }
  if (expiry_date) {
    cookies.push(
      cookie.serialize(EXP_COOKIE, String(expiry_date), {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      })
    );
  }
  return cookies;
}

export function setTokensOnRes(res, tokens) {
  const setCookieValues = serializeAuthCookies(tokens);
  if (setCookieValues.length) {
    res.setHeader("Set-Cookie", setCookieValues);
  }
}

export function clearTokens(res) {
  const del = (name) =>
    cookie.serialize(name, "", {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 0,
    });
  res.setHeader("Set-Cookie", [del(TOKEN_COOKIE), del(RT_COOKIE), del(EXP_COOKIE)]);
}

export function readTokensFromReq(req) {
  const hdr = req.headers.cookie || "";
  const parsed = cookie.parse(hdr);
  const access_token = parsed[TOKEN_COOKIE];
  const refresh_token = parsed[RT_COOKIE];
  const expiry = parsed[EXP_COOKIE] ? Number(parsed[EXP_COOKIE]) : undefined;
  if (!access_token && !refresh_token) return null;
  return { access_token, refresh_token, expiry_date: expiry };
}

export async function ensureFreshTokens(req, res) {
  const stored = readTokensFromReq(req);
  if (!stored) return null;

  if (stored.access_token && stored.expiry_date) {
    if (stored.expiry_date - Date.now() > 60_000) {
      return stored;
    }
  }

  if (!stored.refresh_token) return null;

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: stored.refresh_token });
  const { credentials } = await oauth2Client.refreshAccessToken();

  setTokensOnRes(res, credentials);

  return {
    access_token: credentials.access_token,
    refresh_token: stored.refresh_token || credentials.refresh_token,
    expiry_date: credentials.expiry_date,
  };
}

export function clientWithTokens(tokens) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export function absoluteUrl(path = "/") {
  const base =
    NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
