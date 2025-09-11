// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../../lib/googleClient";

export default function handler(req, res) {
  try {
    const state = typeof req.query.state === "string" ? req.query.state : "/settings";
    const url = getAuthUrl(state);
    return res.redirect(302, url);
  } catch (e) {
    console.error("[oauth/start] error:", e?.message);
    return res
      .status(500)
      .send("OAuth start failed on the server. Check logs for details.");
  }
}
