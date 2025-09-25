// /pages/api/google/status.js
import { getEnv, ensureOAuthWithCookie, inferRedirectUri } from "@/lib/googleClient";

export default async function handler(req, res) {
  try {
    const { clientId } = getEnv();
    const { hasTokens } = ensureOAuthWithCookie(req, res);
    const redirectUri = inferRedirectUri(req);
    return res.status(200).json({
      ok: true,
      connected: !!hasTokens,
      clientIdSuffix: clientId ? clientId.split("-")[0] : null,
      redirectUri,
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
}
