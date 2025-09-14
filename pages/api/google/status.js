import { hydrateFromCookie, diag } from "../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const { ready, auth, tokens } = await hydrateFromCookie(req, res);
    if (!ready) {
      res.status(200).json({
        connected: false,
        email: null,
        expiresIn: null,
        diag: diag(req),
      });
      return;
    }

    let email = null;
    try {
      const info = await auth.getTokenInfo(tokens.access_token);
      email = info.email || null;
    } catch {}

    const expiresIn =
      typeof tokens?.expiry_date === "number"
        ? Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000))
        : null;

    res.status(200).json({
      connected: true,
      email,
      expiresIn,
      diag: diag(req),
    });
  } catch (e) {
    res.status(200).json({
      connected: false,
      email: null,
      expiresIn: null,
      error: String(e),
      diag: diag(req),
    });
  }
}
