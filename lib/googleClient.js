// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "";
const REDIRECT_PATH = process.env.GOOGLE_REDIRECT_PATH || "/api/google/oauth/callback";
const REDIRECT_URI = `${APP_URL}${REDIRECT_PATH}`;

function required(name, val) {
  if (!val) throw new Error(`Missing required env: ${name}`);
  return val;
}

const clientId = required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
const clientSecret = required("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);

export function getOAuthClient() {
  return new google.auth.OAuth2({
    clientId,
    clientSecret,
    redirectUri: REDIRECT_URI,
  });
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
];

export function getAuthUrl(state = "/") {
  const oAuth2Client = getOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
    include_granted_scopes: true,
  });
}

export function setTokensCookie(res, tokens) {
  const serialized = cookie.serialize("amplyai_google", JSON.stringify(tokens), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
  });
  res.setHeader("Set-Cookie", serialized);
}

export function readTokensFromReq(req) {
  const raw = req.headers.cookie || "";
  const cookies = Object.fromEntries(
    raw.split(";").map(c => c.trim().split("=").map(decodeURIComponent)).filter(a => a[0])
  );
  try { return JSON.parse(cookies["amplyai_google"] || "null"); } catch { return null; }
}

export function clientWithTokens(tokens) {
  const auth = getOAuthClient();
  auth.setCredentials(tokens);
  return google.calendar({ version: "v3", auth });
}

export async function ensureFreshTokens(req, res) {
  const tokens = readTokensFromReq(req);
  if (!tokens) return null;

  const auth = getOAuthClient();
  auth.setCredentials(tokens);
  try {
    const refreshed = await auth.getAccessToken(); // triggers refresh if needed
    if (refreshed && auth.credentials) {
      setTokensCookie(res, auth.credentials);
      return auth.credentials;
    }
    return tokens;
  } catch {
    return null;
  }
}
