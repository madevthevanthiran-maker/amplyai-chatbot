// pages/api/google/oauth/start.js
import { getAuthUrl, safeDiag } from "../../../../lib/googleClient";

export default function handler(req, res) {
  try {
    const url = getAuthUrl();
    if (!url) {
      return res
        .status(200)
        .json({
          ok: false,
          error:
            "OAuth not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.",
          diag: safeDiag(),
        });
    }
    return res.status(200).json({ ok: true, url });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
