// /pages/api/google/oauth/callback.js
import {
  exchangeCodeForTokens,
  setTokenCookies,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;

    if (!code) {
      console.error("OAuth callback: missing code", req.query);
      return res.redirect("/settings?error=missing_code");
    }

    // Decode the `state` to know where to return
    let from = "/settings";
    if (state) {
      try {
        const parsed = JSON.parse(
          Buffer.from(state, "base64").toString("utf8")
        );
        if (parsed?.from && typeof parsed.from === "string") from = parsed.from;
      } catch (e) {
        console.warn("Bad state", e);
      }
    }

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens) {
      console.error("OAuth callback: no tokens returned");
      return res.redirect(`${from}?error=no_tokens`);
    }

    setTokenCookies(res, tokens);
    return res.redirect(`${from}?connected=1`);
  } catch (err) {
    console.error("OAuth callback error:", err?.message, err?.response?.data);
    return res.redirect("/settings?error=oauth_failed");
  }
}
