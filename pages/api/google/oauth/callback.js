// /pages/api/google/oauth/callback.js
import {
  oauth2Client,
  setTokensCookie,
  getAuthUrl,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code) {
    // No code → start again
    const url = getAuthUrl("/settings");
    res.writeHead(302, { Location: url });
    return res.end();
  }

  try {
    const client = oauth2Client();
    const { tokens } = await client.getToken(code);
    setTokensCookie(res, tokens);

    // Send user back to where they began (default /settings)
    const dest = typeof state === "string" && state ? state : "/settings";
    res.writeHead(302, { Location: dest });
    res.end();
  } catch (e) {
    console.error("OAuth callback error:", e?.message);
    res.status(500).send("OAuth failed. Try again from Settings.");
  }
}
