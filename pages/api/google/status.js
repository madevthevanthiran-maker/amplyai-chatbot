// pages/api/google/status.js
import { getStatus, safeDiag } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const status = await getStatus(req);
    return res.status(200).json(status);
  } catch (e) {
    return res.status(200).json({
      connected: false,
      error: e.message,
      diag: safeDiag(),
    });
  }
}
