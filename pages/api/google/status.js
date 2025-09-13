// /pages/api/google/status.js
import { google } from "googleapis";
import { readGoogleTokens } from "@/lib/googleCookie";

export default async function handler(req, res) {
  try {
    const tokens = readGoogleTokens(req);
    if (!tokens?.access_token && !tokens?.refresh_token) {
      return res.status(200).json({
        connected: false,
        scopesOk: false,
        expiresIn: null,
        email: null,
      });
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    if (tokens.refresh_token) client.setCredentials({ refresh_token: tokens.refresh_token });
    if (tokens.access_token) client.setCredentials({ access_token: tokens.access_token });

    let email = null;
    let scopesOk = true;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: client });
      const me = await oauth2.userinfo.get();
      email = me?.data?.email || null;
    } catch {
      scopesOk = !!tokens.refresh_token;
    }

    const expiresIn = tokens.expiry_date
      ? Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000))
      : null;

    return res.status(200).json({ connected: true, scopesOk, expiresIn, email });
  } catch {
    return res.status(200).json({
      connected: false,
      scopesOk: false,
      expiresIn: null,
      email: null,
    });
  }
}
