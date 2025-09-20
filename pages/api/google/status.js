// /pages/api/google/status.js
import { getCookieSession, cookieName } from "../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const sess = getCookieSession(req, res);
    const connected = !!sess.access_token || !!sess.refresh_token;
    const expiresIn =
      typeof sess.expiry_date === "number"
        ? Math.max(0, Math.floor((sess.expiry_date - Date.now()) / 1000))
        : null;

    res.status(200).json({
      connected,
      email: sess.email || null,
      expiresIn,
      scopesOk: Array.isArray(sess.scopes) &&
        sess.scopes.includes("https://www.googleapis.com/auth/calendar.events") &&
        sess.scopes.includes("https://www.googleapis.com/auth/calendar.readonly"),
      cookie: cookieName,
    });
  } catch (e) {
    res.status(200).json({ connected: false, error: String(e?.message || e) });
  }
}
