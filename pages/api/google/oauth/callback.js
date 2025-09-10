// /pages/api/google/oauth/callback.js
import { getOAuthClient, setTokensCookie } from "../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) throw new Error("Missing code");

    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    setTokensCookie(res, tokens);

    res.writeHead(302, { Location: typeof state === "string" ? state : "/settings" });
    res.end();
  } catch (err) {
    console.error("OAuth callback error:", err?.message);
    res.status(500).send("OAuth failed");
  }
}
