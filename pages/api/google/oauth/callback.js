// /pages/api/google/oauth/callback.js
import {
  exchangeCodeForTokens,
  setTokensCookie,
  clearTokensCookie,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send("Missing code");
    }
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens?.access_token) throw new Error("No access token");

    setTokensCookie(res, tokens);
    const returnTo = typeof state === "string" ? state : "/settings";
    res.redirect(302, returnTo);
  } catch (err) {
    clearTokensCookie(res);
    res.status(500).send(`OAuth failed: ${err.message || "unknown"}`);
  }
}
