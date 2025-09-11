// /lib/googleClient.js
import { google } from "googleapis";

function must(name, value) {
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function getRedirectUri() {
  // Prefer explicit env; fall back to APP_URL to reduce preview issues.
  const fromEnv = process.env.GOOGLE_REDIRECT_URI;
  if (fromEnv) return fromEnv;
  const app = must("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL);
  return `${app.replace(/\/$/, "")}/api/google/oauth/callback`;
}

export function getOAuthClient() {
  const clientId = must("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
  const clientSecret = must("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
  const redirectUri = getRedirectUri();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export const calendar = google.calendar("v3");

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

// Build a consent URL (absolute) so redirects are stable.
export function getAuthUrl(state = "/settings") {
  const oAuth2Client = getOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}
