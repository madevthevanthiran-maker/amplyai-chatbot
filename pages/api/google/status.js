// /pages/api/google/status.js
import { status, safeDiag } from "@/lib/googleClient";

export default async function handler(req, res) {
  try {
    const s = await status(req);
    res.status(200).json({ ok: true, status: s, diag: safeDiag() });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
}
