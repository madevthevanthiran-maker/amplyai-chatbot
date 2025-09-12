import { google } from 'googleapis';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  console.warn('[googleAuth] Missing Google OAuth env vars.');
}

export function createOAuth2Client() {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

export async function getOAuth2ClientWithTokens(tokens) {
  const oauth2Client = createOAuth2Client();
  if (tokens) oauth2Client.setCredentials(tokens);

  try {
    if (tokens && tokens.expiry_date && tokens.expiry_date - Date.now() < 2 * 60 * 1000) {
      const res = await oauth2Client.refreshAccessToken();
      const newTokens = res.credentials;
      oauth2Client.setCredentials(newTokens);
      return { oauth2Client, tokens: newTokens, refreshed: true };
    }
  } catch (e) {
    console.error('[googleAuth] refreshAccessToken failed', e?.response?.data || e?.message);
  }
  return { oauth2Client, tokens, refreshed: false };
}
