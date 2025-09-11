// /pages/api/google/oauth/callback.js
import { exchangeCodeForTokens, setTokenCookies } from "../../../../lib/googleClient";

function htmlEscape(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function handler(req, res) {
  try {
    const { code, state, error, error_description, ...rest } = req.query || {};

    // If Google returned an error param, show it plainly.
    if (error) {
      console.error("[oauth/callback] provider error:", { error, error_description, rest });
      return res
        .status(400)
        .send(
          `OAuth error from Google:<br><pre>${htmlEscape(
            JSON.stringify({ error, error_description, rest }, null, 2)
          )}</pre>`
        );
    }

    if (!code) {
      console.error("[oauth/callback] missing code. query=", req.query);
      return res
        .status(400)
        .send(
          `OAuth failed: "code" missing.<br><pre>${htmlEscape(
            JSON.stringify(req.query, null, 2)
          )}</pre>`
        );
    }

    try {
      const { tokens } = await exchangeCodeForTokens(code);
      setTokenCookies(res, tokens);
      const redirectTo = state && typeof state === "string" ? state : "/settings";
      return res.redirect(302, redirectTo);
    } catch (err) {
      console.error("[oauth/callback] token exchange failed:", {
        message: err?.message,
        code: err?.code,
        response: err?.response?.data,
      });
      // Show full diagnostic so you can fix quickly (redirect mismatch etc.)
      return res
        .status(400)
        .send(
          `Token exchange failed.<br><b>Most common cause:</b> Redirect URI mismatch.<br><br><pre>${htmlEscape(
            JSON.stringify(
              {
                message: err?.message,
                code: err?.code,
                response: err?.response?.data,
                query: req.query,
              },
              null,
              2
            )
          )}</pre>`
        );
    }
  } catch (outer) {
    console.error("[oauth/callback] outer error:", outer?.message);
    return res.status(400).send("OAuth failed. Try again from Settings.");
  }
}
