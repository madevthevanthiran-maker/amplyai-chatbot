// /pages/api/google/oauth/logout.js
import { clearCookieSession } from "../../../../lib/googleClient";

export default function handler(req, res) {
  try {
    clearCookieSession(req, res);
    const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/settings";
    res.writeHead(302, { Location: returnTo });
    res.end();
  } catch (err) {
    res.status(200).json({ ok: false, error: String(err?.message || err) });
  }
}
