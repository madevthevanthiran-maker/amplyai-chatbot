// /pages/api/google/oauth/logout.js
import { clearTokenCookies, oauthFromCookies } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const client = oauthFromCookies(req, res);
    try {
      // Best-effort revoke current token; ignore failures
      const { credentials } = client;
      if (credentials?.access_token) {
        await client.revokeToken(credentials.access_token);
      }
      if (credentials?.refresh_token) {
        await client.revokeToken(credentials.refresh_token);
      }
    } catch {}

    clearTokenCookies(res);
    res.status(200).json({ ok: true, message: "Disconnected." });
  } catch (e) {
    clearTokenCookies(res);
    res.status(200).json({ ok: true, message: "Disconnected." });
  }
}
