import { exchangeCode } from "../../../../lib/googleClient";
import { setTokensCookie } from "../../../../lib/googleCookie";

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) {
      res.status(400).send("Missing code");
      return;
    }

    const tokens = await exchangeCode(code);
    setTokensCookie(res, req, tokens);

    let returnTo = "/settings";
    try {
      if (state) {
        const parsed = JSON.parse(
          Buffer.from(state, "base64url").toString("utf8")
        );
        if (parsed?.returnTo) returnTo = parsed.returnTo;
      }
    } catch {}

    const sep = returnTo.includes("?") ? "&" : "?";
    res.redirect(302, `${returnTo}${sep}gcb=1`);
  } catch (e) {
    res.status(500).json({
      ok: false,
      where: "oauth/callback",
      error: String(e),
      hint:
        "Most common cause: redirect URI mismatch. Ensure GOOGLE_REDIRECT_URI exactly matches the URL configured in Google Cloud Console.",
    });
  }
}
