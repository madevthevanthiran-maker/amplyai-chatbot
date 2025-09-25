// /pages/api/google/oauth/callback.js
import {
  getEnv,
  makeOAuth2Client,
  inferRedirectUri,
  exchangeCodeAndStore,
} from "@/lib/googleClient";

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send("Missing ?code");

    const { clientId, clientSecret } = getEnv();
    const redirectUri = inferRedirectUri(req);
    const oauth2 = makeOAuth2Client({ clientId, clientSecret, redirectUri });

    await exchangeCodeAndStore(oauth2, code, res);

    // send back to settings page
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return res.redirect(302, `${proto}://${host}/settings`);
  } catch (e) {
    res.status(500).send("OAuth callback failed: " + (e?.message || e));
  }
}
