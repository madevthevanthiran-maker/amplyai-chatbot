import { safeDiag } from "../../../lib/googleClient";

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    diag: safeDiag(req),
    hint:
      "redirectUri MUST match Google Console exactly. If diag.hasCookie=false after OAuth, cookie policy was blocking — our cookie helper now sets SameSite=None; Secure on HTTPS and Lax on localhost.",
  });
}
