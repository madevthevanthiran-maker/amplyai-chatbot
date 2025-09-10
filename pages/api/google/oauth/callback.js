// /pages/api/google/oauth/callback.js
import { getOAuth2Client } from "googleapis/build/src/apis/oauth2"; // not used, but ok
import { getBaseUrl, setTokensCookie } from "../../../../lib/googleClient";
import { google } from "googleapis";

function getClient(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${getBaseUrl(req)}/api/google/oauth/callback`;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send("Missing code");
    }
    const oauth2 = getClient(req);
    const { tokens } = await oauth2.getToken(code.toString());
    setTokensCookie(res, tokens);
    // Go back to where we started (default /settings)
    const back = state ? state.toString() : "/settings";
    return res.redirect(302, back);
  } catch (err) {
    return res.status(500).send(err?.message || "OAuth callback failed");
  }
}
