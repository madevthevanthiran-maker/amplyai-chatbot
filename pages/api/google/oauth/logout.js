// /pages/api/google/oauth/logout.js
import { clearCookieSession } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    clearCookieSession(req, res);
    const returnTo = (req.query.returnTo as string) || "/settings";
    res.redirect(returnTo);
  } catch (err) {
    res.status(200).json({ ok: false, error: String(err?.message || err) });
  }
}
