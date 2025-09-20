// /pages/api/google/oauth/callback.js
import { newOAuthClient, writeTokensToRes } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const { code, state, error } = req.query || {};

    if (error) {
      return res.status(400).send(`Google OAuth error: ${error}`);
    }
    if (!code) {
      return res.status(400).send("Missing ?code from Google OAuth.");
    }

    const client = newOAuthClient();

    // Exchange code -> { tokens }
    const { tokens } = await client.getToken(code);
    if (!tokens) throw new Error("No tokens returned by Google.");

    // Important: persist refresh_token if present
    writeTokensToRes(res, {
      access_token: tokens.access_token || null,
      refresh_token: tokens.refresh_token || null, // may be undefined if Google reused a session
      expiry_date: tokens.expiry_date || null,
    });

    // Redirect back to Settings so the UI can show "Connected"
    const back = "/settings";
    res.writeHead(302, { Location: back });
    res.end();
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("OAuth callback failed.");
  }
}
