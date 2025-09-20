// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const returnTo = (req.query.returnTo as string) || "/settings";
    const url = getAuthUrl({ returnTo });
    res.status(200).json({ ok: true, url });
  } catch (err) {
    res.status(200).json({
      ok: false,
      where: "oauth/start",
      error: String(err?.message || err),
      hint: "Verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI are set and match Google Console.",
    });
  }
}
