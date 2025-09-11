// /pages/api/google/oauth/callback.js
import { oauth2Client, exchangeCodeForTokens, setTokenCookies } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    console.log("[oauth/callback] query:", req.query); // debug

    const { code, state } = req.query;
    if (!code) {
      console.error("[oauth/callback] missing code");
      return res.status(400).send("OAuth failed. Try again from Settings.");
    }

    // Exchange code for tokens
    const { tokens } = await exchangeCodeForTokens(code);
    console.log("[oauth/callback] got tokens:", Object.keys(tokens)); // safe log

    // Store tokens in cookies
    setTokenCookies(res, tokens);

    // Redirect back to settings or state param
    const redirectTo = state && typeof state === "string" ? state : "/settings";
    return res.redirect(302, redirectTo);
  } catch (err) {
    console.error("[oauth/callback] error:", {
      message: err?.message,
      code: err?.code,
      response: err?.response?.data,
    });
    return res.status(400).send("OAuth failed. Try again from Settings.");
  }
}
