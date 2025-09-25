// /pages/api/google/oauth/start.js
import { getEnv, makeOAuth2Client, inferRedirectUri, getAuthUrl } from "@/lib/googleClient";

export default async function handler(req, res) {
  try {
    const { clientId, clientSecret } = getEnv();
    const redirectUri = inferRedirectUri(req);
    const oauth2 = makeOAuth2Client({ clientId, clientSecret, redirectUri });
    const url = getAuthUrl(oauth2);
    return res.redirect(302, url);
  } catch (e) {
    res.status(500).send("OAuth start failed: " + (e?.message || e));
  }
}
