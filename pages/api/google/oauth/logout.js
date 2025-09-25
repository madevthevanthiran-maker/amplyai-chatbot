// /pages/api/google/oauth/logout.js
import { clearCookieSession } from "@/lib/googleClient";

export default async function handler(_req, res) {
  clearCookieSession(res);
  res.status(200).json({ ok: true });
}
