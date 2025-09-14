import { exchangeCodeForTokens } from "../../../../lib/googleClient";
import { writeTokensCookie } from "../../../../lib/googleCookie";

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) {
      res.status(400).send("Missing code");
      return;
    }

    const tokens = await exchangeCodeForTokens(code);

    // Persist tokens
    writeTokensCookie(res, req, tokens);

    let returnTo = "/settings";
    try {
      if (state) {
        const parsed = JSON.parse(
          Buffer.from(state, "base64url").toString("utf8")
        );
        if (parsed?.returnTo) returnTo = parsed.returnTo;
      }
    } catch {}

    // Add a harmless flag so UI can clean it and know a round-trip occurred.
    const sep = returnTo.includes("?") ? "&" : "?";
    res.redirect(`${returnTo}${sep}gcb=1`);
  } catch (err) {
    res
      .status(500)
      .json({ ok: false, message: "OAuth callback failed", error: String(err) });
  }
}
