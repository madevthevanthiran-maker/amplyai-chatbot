// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env;

if (!GOOGLE_CLIENT_ID) throw new Error("Missing env: GOOGLE_CLIENT_ID");
if (!GOOGLE_CLIENT_SECRET) throw new Error("Missing env: GOOGLE_CLIENT_SECRET");
if (!GOOGLE_REDIRECT_URI) throw new Error("Missing env: GOOGLE_REDIRECT_URI");

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events", // create/update events
];

// Single helper to build an OAuth2 instance
function newOAuth() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/** Build the Google consent URL. Carries a `state` with where to return to. */
export function getAuthUrl(fromPath = "/settings") {
  const oauth2 = newOAuth();
  const state = Buffer.from(JSON.stringify({ from: fromPath }), "utf8").toString(
    "base64"
  );

  return oauth2.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent", // ensure refresh_token on first connect
    scope: SCOPES,
    state,
  });
}

/** Exchange an OAuth `code` for tokens. */
export async function exchangeCodeForTokens(code) {
  const oauth2 = newOAuth();
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

/** Read tokens from cookies on the request. */
export function readTokensFromReq(req) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const access_token = cookies.ggl_access || null;
    const refresh_token = cookies.ggl_refresh || null;
    return access_token || refresh_token
      ? { access_token, refresh_token }
      : null;
  } catch {
    return null;
  }
}

/** Store tokens in secure httpOnly cookies. */
export function setTokenCookies(res, tokens) {
  const cookies = [];

  if (tokens.refresh_token) {
    cookies.push(
      cookie.serialize("ggl_refresh", tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 180, // 180 days
      })
    );
  }

  if (tokens.access_token) {
    // If Google returned an expiry_date (ms), convert to seconds
    const maxAge =
      typeof tokens.expiry_date === "number"
        ? Math.max(30, Math.floor((tokens.expiry_date - Date.now()) / 1000))
        : 60 * 60; // default 1h

    cookies.push(
      cookie.serialize("ggl_access", tokens.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge,
      })
    );
  }

  if (cookies.length) {
    res.setHeader("Set-Cookie", cookies);
  }
}

/**
 * Ensure we have a usable access_token.
 * If only refresh_token is available, refresh and set a new access cookie.
 * Returns tokens or null if nothing available.
 */
export async function ensureFreshTokens(req, res) {
  const existing = readTokensFromReq(req);
  if (!existing) return null;

  // If we already have an access_token, use it
  if (existing.access_token) return existing;

  // Try refreshing using refresh_token
  if (existing.refresh_token) {
    const oauth2 = newOAuth();
    oauth2.setCredentials({ refresh_token: existing.refresh_token });

    // googleapis v105+: use getAccessToken or refreshToken
    // Prefer refreshToken to force a new access token immediately
    const { credentials } = await oauth2.refreshToken(
      existing.refresh_token
    );

    const merged = {
      access_token: credentials.access_token,
      refresh_token: existing.refresh_token, // keep original if Google didn’t resend
      expiry_date: credentials.expiry_date,
    };
    setTokenCookies(res, merged);
    return merged;
  }

  return null;
}

/** Build a Calendar client with tokens. */
export function clientWithTokens(tokens) {
  const oauth2 = newOAuth();
  oauth2.setCredentials({
    access_token: tokens.access_token || undefined,
    refresh_token: tokens.refresh_token || undefined,
  });
  return google.calendar({ version: "v3", auth: oauth2 });
}
