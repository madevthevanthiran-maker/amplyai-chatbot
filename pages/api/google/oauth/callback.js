// /pages/api/google/oauth/callback.js
import { oauth2Client } from "../../../../lib/googleClient";
import { setGoogleTokensCookie } from "../../../../lib/googleCookie";

export default async function handler(req, res) {
  const { code, state } = req.query;

  try {
    if (!code) throw new Error("Missing code");

    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });

    // Persist cookie BEFORE redirecting
    setGoogleTokensCookie(res, tokens);

    const returnTo = state ? decodeURIComponent(state) : "/settings?connected=1";
    res.writeHead(302, { Location: returnTo });
    res.end();
  } catch (err) {
    console.error("OAuth callback error:", err?.response?.data || err);
    res.writeHead(302, { Location: "/settings?error=oauth_callback" });
    res.end();
  }
}
