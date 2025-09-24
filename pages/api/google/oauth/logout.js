// /pages/api/google/oauth/logout.js
import { clearAuthCookie } from "@/lib/googleClient";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  clearAuthCookie(res);
  res.status(200).json({ ok: true });
}
