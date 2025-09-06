// /pages/api/google/oauth/start.js
// Starts Google OAuth for Calendar access and redirects to Google's consent screen.

import { getAuthUrl } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const url = getAuthUrl(state);
    res.writeHead(302, { Location: url });
    res.end();
  } catch (err) {
    console.error("OAuth start error:", err);
    res.status(500).json({ error: "Failed to start Google OAuth" });
  }
}
