// /lib/googleClient.js
// Minimal Google OAuth + Calendar helpers (node runtime)

import { google } from "googleapis";
import { readGoogleTokens, writeGoogleTokens } from "@/lib/googleCookie";

// Small diag helper used by /api/google/debug.js (your build warned it’s missing)
export function diag() {
  return {
    env: {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasRedirect: !!process.env.GOOGLE_REDIRECT_URI,
    },
    now: new Date().toISOString(),
  };
}

// Create an OAuth2 client configured from env
export function oauth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/google/oauth/callback`;

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Hydrate OAuth client from cookie (access/refresh tokens)
// Returns { oauth2, ready: boolean, email?: string, expiresIn?: number, scopesOk?: boolean }
export async function hydrateClientFromCookie(req, res) {
  const tokens = readGoogleTokens(req);
  const oauth2 = oauth2Client();

  if (!tokens) {
    return { oauth2, ready: false };
  }

  oauth2.setCredentials(tokens);

  // attempt to refresh if needed (and persist)
  try {
    // googleapis automatically refreshes when expired; we can force a token check:
    const access = await oauth2.getAccessToken(); // triggers refresh if expired
    if (access?.token && oauth2.credentials) {
      // persist possibly-updated tokens (including new expiry_date)
      writeGoogleTokens(res, oauth2.credentials);
    }
  } catch (e) {
    // refresh failed -> not ready
    return { oauth2, ready: false, error: String(e?.message || e) };
  }

  // Best-effort “whoami”
  let email = null;
  try {
    const oauth2api = google.oauth2({ version: "v2", auth: oauth2 });
    const me = await oauth2api.userinfo.get();
    email = me?.data?.email || null;
  } catch { /* ignore */ }

  // Optional: check calendar scopes
  const scopesOk = true; // if you want, inspect oauth2.credentials.scope

  const expiresIn =
    typeof oauth2.credentials.expiry_date === "number"
      ? Math.max(0, Math.floor((oauth2.credentials.expiry_date - Date.now()) / 1000))
      : null;

  return { oauth2, ready: true, email, expiresIn, scopesOk };
}

// Calendar client factory (build log says this wasn’t exported)
export function calendarClient(auth) {
  return google.calendar({ version: "v3", auth });
}
