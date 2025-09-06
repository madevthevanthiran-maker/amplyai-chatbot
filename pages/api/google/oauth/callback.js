// /pages/api/google/oauth/callback.js

import {
  exchangeCodeForTokens,
  writeTokensToRes,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  const { code, state = "" } = req.query || {};
  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    writeTokensToRes(res, tokens);

    // Send user back to the app (state can be a return path like "/settings")
    const returnTo = typeof state === "string" && state ? state : "/";
    res.writeHead(302, { Location: returnTo + "?google=connected" });
    res.end();
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.writeHead(302, { Location: "/?google=error" });
    res.end();
  }
}
