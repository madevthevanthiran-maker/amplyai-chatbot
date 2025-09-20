// /pages/api/google/status.js
import { getCookieSession, cookieName } from "../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const sess = getCookieSession(req, res);
    const connected = !!sess.access_token;
    const exp = sess.expires_at ? Math.max(0, sess.expires_at - Math.floor(Date.now() / 1000)) : null;

    res.status(200).json({
      connected,
      email: sess.email || null,
      expiresIn: exp,
      scopesOk: Array.isArray(sess.scopes) &&
        sess.scopes.includes("https://www.googleapis.com/auth/calendar.events") &&
        sess.scopes.includes("https://www.googleapis.com/auth/calendar.readonly"),
      cookie: cookieName,
    });
  } catch (err) {
    res.status(200).json({ connected: false, error: String(err?.message || err) });
  }
}
