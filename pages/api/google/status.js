// /pages/api/google/status.js
import { safeDiag } from "../../../lib/googleClient";

export default function handler(req, res) {
  const d = safeDiag(req);
  res.status(200).json({
    ok: true,
    ...d,
    connected: Boolean(d.hasRefresh || d.hasAccess),
  });
}
