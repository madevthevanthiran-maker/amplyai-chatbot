// /pages/api/google/oauth/start.js
import { getAuthUrl, safeDiag } from "@/lib/googleClient";

export default async function handler(req, res) {
  try {
    const url = getAuthUrl(); // named export (fixed)
    res.status(200).json({ ok: true, url });
  } catch (err) {
    res.status(500).json({
      ok: false,
      where: "oauth/start",
      error: String(err),
      hint:
        "Verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI are set and match Google Console.",
      diag: safeDiag(),
    });
  }
}
