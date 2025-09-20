import { getAuthUrl } from "../../../../lib/googleClient";

export default function handler(req, res) {
  try {
    const url = getAuthUrl();
    return res.status(200).json({ ok: true, url });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      where: "oauth/start",
      error: e.message,
      hint:
        "Verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI are set and match Google Console.",
    });
  }
}
