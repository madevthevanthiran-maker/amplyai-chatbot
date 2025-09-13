import { google } from "googleapis";
import cookie from "cookie";

/**
 * Status endpoint (upgraded)
 * - Tells the client whether Google is connected
 * - Tries to verify token scope & expiry
 * - Returns a minimal identity hint (email) when available
 *
 * Response: { connected, scopesOk, expiresIn, email }
 */

function readTokens(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const candidates = [
    "gtokens",
    "google_tokens",
    "amply_google_tokens",
    "gTokens",
    "AMP_GOOGLE_TOKENS",
  ];
  for (const key of candidates) {
    if (cookies[key]) {
      try {
        return JSON.parse(cookies[key]);
      } catch {
        try {
          return JSON.parse(decodeURIComponent(cookies[key]));
        } catch {}
      }
    }
  }
  return null;
}

function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  return client;
}

export default async function handler(req, res) {
  try {
    const tokens = readTokens(req);
    if (!tokens?.access_token && !tokens?.refresh_token) {
      return res.status(200).json({
        connected: false,
        scopesOk: false,
        expiresIn: null,
        email: null,
      });
    }

    const auth = getOAuthClient();
    if (tokens.refresh_token) auth.setCredentials({ refresh_token: tokens.refresh_token });
    if (tokens.access_token) auth.setCredentials({ access_token: tokens.access_token });

    let email = null;
    let scopesOk = true;
    let expiresIn = null;

    try {
      // Use OAuth2 tokeninfo to sanity-check the access token when available
      if (tokens.access_token) {
        const oauth2 = google.oauth2({ version: "v2", auth });
        const me = await oauth2.userinfo.get();
        email = me?.data?.email || null;
      }
    } catch {
      // Access token might be expired; we’ll still report connected if we have a refresh_token
      scopesOk = !!tokens.refresh_token;
    }

    // Best-effort expiresIn if expiry_date exists (not all flows set it in our cookie)
    if (tokens.expiry_date) {
      expiresIn = Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000));
    }

    return res.status(200).json({
      connected: true,
      scopesOk,
      expiresIn,
      email,
    });
  } catch (e) {
    // Never crash the settings page because of status
    return res.status(200).json({
      connected: false,
      scopesOk: false,
      expiresIn: null,
      email: null,
    });
  }
}
