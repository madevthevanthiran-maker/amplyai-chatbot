// /pages/api/google/debug.js
import { safeDiag } from "../../../lib/googleClient";

export default function handler(req, res) {
  const d = safeDiag();
  res.status(200).json({
    ok: true,
    diag: d,
    hint:
      "redirectUri MUST match Google Console's OAuth client redirect EXACTLY. " +
      "If this shows the wrong URL, fix GOOGLE_REDIRECT_URI in Vercel envs and redeploy.",
  });
}
