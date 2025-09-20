// pages/api/google/oauth/logout.js
import { clearAuthCookie } from "../../../../lib/googleClient";

export default function handler(req, res) {
  try {
    clearAuthCookie(res);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message });
  }
}
