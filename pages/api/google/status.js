import { hydrateClientFromCookie, safeDiag } from "../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const { oauth2, tokens, ready } = await hydrateClientFromCookie(req, res);

    if (!ready) {
      res.status(200).json({
        connected: false,
        email: null,
        expiresIn: null,
        scopesOk: false,
        diag: safeDiag(req),
      });
      return;
    }

    // Try to read profile email via tokeninfo (optional but nice)
    let email = null;
    try {
      const tokenInfo = await oauth2.getTokenInfo(tokens.access_token);
      email = tokenInfo.email || null;
    } catch {}

    const expiresIn =
      typeof tokens.expiry_date === "number"
        ? Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000))
        : null;

    res.status(200).json({
      connected: true,
      email,
      expiresIn,
      scopesOk: true,
      diag: safeDiag(req),
    });
  } catch (e) {
    res.status(200).json({
      connected: false,
      email: null,
      expiresIn: null,
      scopesOk: false,
      error: String(e),
      diag: safeDiag(req),
    });
  }
}
