// /pages/api/google/oauth/callback.js
import {
  exchangeCodeForTokens,
  setTokenCookies,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    console.log("[oauth/callback] query:", req.query);

    const { code, state, error } = req.query;

    if (error) {
      console.error("[oauth/callback] provider error:", error);
      return res.status(400).send("OAuth failed. Try again from Settings.");
    }

    if (!code) {
      console.error("[oauth/callback] missing code");
      return res.status(400).send("OAuth failed. Try again from Settings.");
    }

    // Exchange auth code for tokens
    const { tokens } = await exchangeCodeForTokens(code);
    console.log("[oauth/callback] tokens received:", Object.keys(tokens));

    setTokenCookies(res, tokens);

    // Redirect to the page we came from (default: /settings)
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
