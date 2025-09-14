import { getAuthUrl } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const { returnTo = "/settings" } = req.query;
    const state = Buffer.from(JSON.stringify({ returnTo }), "utf8").toString(
      "base64url"
    );
    const url = getAuthUrl(state);
    res.redirect(302, url);
  } catch (e) {
    // Never surface a blank 500; show JSON so you know what's wrong
    res.status(500).json({
      ok: false,
      where: "oauth/start",
      error: String(e),
      hint:
        "Verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI are set and match Google Console.",
    });
  }
}
