import { getOAuthClient } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const client = getOAuthClient();
    const state = (req.query.state || "/settings").toString();

    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      state,
    });

    // If this endpoint is called by JS, return JSON; if clicked as <a>, redirect.
    if (req.headers.accept?.includes("application/json")) {
      res.status(200).json({ authUrl: url });
    } else {
      res.redirect(302, url);
    }
  } catch (e) {
    res.status(500).send(`OAuth start failed: ${e.message}`);
  }
}
