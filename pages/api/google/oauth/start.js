// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../../lib/googleClient";

export default function handler(req, res) {
  try {
    const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/settings";
    const url = getAuthUrl({ returnTo });
    // Redirect directly to Google (no JSON)
    res.writeHead(302, { Location: url });
    res.end();
  } catch (err) {
    res.status(200).json({
      ok: false,
      where: "oauth/start",
      error: String(err?.message || err),
      hint:
        "Check GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI and that the redirect matches Google Console exactly.",
    });
  }
}
