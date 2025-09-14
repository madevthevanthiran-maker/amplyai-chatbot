import { google } from "googleapis";
import { readTokensFromReq, setTokensCookie } from "./googleCookie";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
  "profile",
];

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getOAuth2() {
  const id = requireEnv("GOOGLE_CLIENT_ID");
  const sec = requireEnv("GOOGLE_CLIENT_SECRET");
  const red = requireEnv("GOOGLE_REDIRECT_URI");
  return new google.auth.OAuth2(id, sec, red);
}

export function getAuthUrl(state = "") {
  const auth = getOAuth2();
  return auth.generateAuthUrl({
    access_type: "offline",  // ensures refresh_token
    prompt: "consent",       // forces refresh_token
    scope: SCOPES,
    include_granted_scopes: true,
    state,
  });
}

export async function exchangeCode(code) {
  const auth = getOAuth2();
  const { tokens } = await auth.getToken(code);
  return tokens; // contains refresh_token on first consent
}

export function tokensNearExpiry(tokens, skewMs = 60_000) {
  if (!tokens?.expiry_date) return true;
  return Date.now() + skewMs >= tokens.expiry_date;
}

export async function hydrateFromCookie(req, res) {
  const auth = getOAuth2();
  const tokens = readTokensFromReq(req);
  if (!tokens?.access_token && !tokens?.refresh_token) {
    return { auth, ready: false, tokens: null };
  }
  auth.setCredentials(tokens);

  if (tokensNearExpiry(tokens) && tokens.refresh_token) {
    try {
      const { credentials } = await auth.refreshAccessToken();
      auth.setCredentials(credentials);
      setTokensCookie(res, req, { ...tokens, ...credentials });
      return { auth, ready: true, tokens: credentials };
    } catch (e) {
      return { auth, ready: false, tokens: null, error: String(e) };
    }
  }

  return { auth, ready: true, tokens };
}

export function calendar(auth) {
  return google.calendar({ version: "v3", auth });
}

export function diag(req) {
  const t = readTokensFromReq(req);
  return {
    hasCookie: !!t,
    hasAccess: !!t?.access_token,
    hasRefresh: !!t?.refresh_token,
    expires: t?.expiry_date ?? null,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || null,
    clientIdSuffix: (process.env.GOOGLE_CLIENT_ID || "").slice(-6),
  };
}
