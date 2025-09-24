// /pages/api/google/status.js
import { readAuthCookie } from "@/lib/googleClient";

export default function handler(req, res) {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env;
  const tokens = readAuthCookie(req);
  res.status(200).json({
    ok: true,
    connected: !!tokens,
    clientIdSuffix: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.slice(-8) : null,
    redirectUri: GOOGLE_REDIRECT_URI,
  });
}
