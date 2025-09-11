import { getOAuthClient } from "../../../../lib/googleClient";
import { setSession } from "../../../../lib/session";

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code) {
    res.status(400).send("OAuth failed. Try again from Settings.");
    return;
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code.toString());
    setSession(res, tokens);
    res.redirect(302, state ? state.toString() : "/settings");
  } catch (e) {
    // Helpful page if Google bounces you to “redirect_uri_mismatch”
    res.status(400).send(
      `Token exchange failed.<br><b>Most common cause:</b> Redirect URI mismatch.<br><br><pre>${JSON.stringify(
        { message: e.message, query: req.query },
        null,
        2
      )}</pre>`
    );
  }
}
