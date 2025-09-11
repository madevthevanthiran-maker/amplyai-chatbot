// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../../lib/googleClient";

export default function handler(req, res) {
  try {
    // Accept state from query (e.g. /api/google/oauth/start?state=/settings)
    const state = typeof req.query.state === "string" ? req.query.state : "/settings";
    const url = getAuthUrl(state);
    return res.redirect(302, url);
  } catch (e) {
    console.error("[oauth/start] error:", e?.message);
    return res.status(500).json({ error: "Failed to start OAuth" });
  }
}
