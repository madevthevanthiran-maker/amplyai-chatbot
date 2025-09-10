// /lib/googleClient.js
import { google } from "googleapis";
import { readGoogleTokensCookie, setGoogleTokensCookie } from "./googleCookie";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function getAuthUrl(returnTo = "/settings") {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: encodeURIComponent(returnTo),
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });
}

export function readTokensFromReq(req) {
  return readGoogleTokensCookie(req);
}

export function clientWithTokens(tokens) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials(tokens);
  return { client, calendar: google.calendar({ version: "v3", auth: client }) };
}

export async function ensureFreshTokens(req, res) {
  const tokens = readTokensFromReq(req);
  if (!tokens) return null;

  const { client } = clientWithTokens(tokens);

  // If token expired and we have refresh_token, Google client will refresh on demand
  try {
    // Make a tiny call to trigger refresh logic
    await client.getAccessToken();
    const creds = client.credentials;
    if (creds && (creds.access_token || creds.refresh_token)) {
      setGoogleTokensCookie(res, creds);
      return creds;
    }
    return tokens;
  } catch (e) {
    console.error("Token refresh error:", e?.response?.data || e?.message || e);
    return null;
  }
}
