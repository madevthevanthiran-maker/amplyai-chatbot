// /pages/api/google/oauth/logout.js
import { revokeFromCookie } from "@/lib/googleClient";

export default async function handler(req, res) {
  try {
    const out = await revokeFromCookie(req, res);
    res.status(200).json({ ok: true, ...out });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
}
