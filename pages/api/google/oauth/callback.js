// /pages/api/google/oauth/callback.js
import { getOAuth2Client, setTokensOnRes, absoluteUrl } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  const { code, state } = req.query || {};
  if (!code) {
    res.status(400).send("Missing OAuth code");
    return;
  }
  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);
    setTokensOnRes(res, tokens);

    const to = typeof state === "string" && state ? state : "/settings";
    res.writeHead(302, { Location: absoluteUrl(to) });
    res.end();
  } catch (err) {
    console.error("OAuth callback error:", err?.message);
    res.status(500).send("OAuth failed");
  }
}
