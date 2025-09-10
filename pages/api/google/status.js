// /pages/api/google/status.js
import { ensureFreshTokens, readTokensFromReq } from "../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    // Try to ensure tokens are present/refreshable
    let tokens = await ensureFreshTokens(req, res);
    if (!tokens) tokens = readTokensFromReq(req);

    if (tokens?.access_token) {
      return res.status(200).json({ connected: true });
    }
    return res.status(200).json({ connected: false });
  } catch (e) {
    // If anything odd happens, treat as not connected (but surface reason)
    return res.status(200).json({ connected: false, error: e?.message || "unknown" });
  }
}
