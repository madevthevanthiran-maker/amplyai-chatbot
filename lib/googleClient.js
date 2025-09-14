import { google } from "googleapis";
import { readTokensFromReq, writeTokensCookie } from "./googleCookie";

// REQUIRED envs
// GOOGLE_CLIENT_ID
// GOOGLE_CLIENT_SECRET
// GOOGLE_REDIRECT_URI   (must exactly match Google Console + Vercel env)

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
  "profile",
];

export function getOAuth2Client() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
      "Missing Google OAuth envs. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI."
    );
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function createAuthUrl(state = "") {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    include_granted_scopes: true,
    state,
  });
}

export async function exchangeCodeForTokens(code) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  return tokens; // { access_token, refresh_token, expiry_date, scope, id_token }
}

export function tokensExpiredSoon(tokens, skewMs = 60_000) {
  if (!tokens?.expiry_date) return true;
  return Date.now() + skewMs >= tokens.expiry_date;
}

export async function hydrateClientFromCookie(req, res) {
  const oauth2 = getOAuth2Client();
  const tokens = readTokensFromReq(req);

  if (!tokens?.access_token && !tokens?.refresh_token) {
    return { oauth2, tokens: null, ready: false };
  }

  oauth2.setCredentials(tokens);

  // Refresh if needed and we have a refresh token
  if (tokensExpiredSoon(tokens) && tokens.refresh_token) {
    try {
      const { credentials } = await oauth2.refreshAccessToken();
      oauth2.setCredentials(credentials);
      // Write back refreshed tokens to cookie
      writeTokensCookie(res, req, {
        ...tokens,
        ...credentials,
      });
      return { oauth2, tokens: credentials, ready: true };
    } catch (err) {
      // If refresh fails, treat as not connected
      return { oauth2, tokens: null, ready: false, error: err };
    }
  }

  return { oauth2, tokens, ready: true };
}

export function calendarClient(oauth2) {
  return google.calendar({ version: "v3", auth: oauth2 });
}

export function safeDiag(req) {
  const tokens = readTokensFromReq(req);
  return {
    hasCookie: !!tokens,
    hasAccess: !!tokens?.access_token,
    hasRefresh: !!tokens?.refresh_token,
    expiry: tokens?.expiry_date ?? null,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || null,
    clientIdSuffix: (process.env.GOOGLE_CLIENT_ID || "").slice(-6),
  };
}
