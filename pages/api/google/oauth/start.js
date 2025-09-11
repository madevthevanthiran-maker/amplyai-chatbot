// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Optional ?state=/where/to/return
    const state = typeof req.query.state === "string" ? req.query.state : "/settings";
    const url = getAuthUrl(state);
    // 302 to Google
    res.writeHead(302, { Location: url });
    res.end();
  } catch (err) {
    res
      .status(500)
      .send(`OAuth start failed: ${err?.message || String(err)}`);
  }
}
