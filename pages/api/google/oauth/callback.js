// /pages/api/google/oauth/callback.js
import {
  oauth2Client,
  writeTokensToRes,
} from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    const { tokens } = await oauth2Client.getToken(code);
    writeTokensToRes(res, tokens);

    const redirectPath = typeof state === "string" ? state : "/settings";
    res.writeHead(302, { Location: redirectPath });
    res.end();
  } catch (err) {
    console.error("OAuth callback error:", err?.response?.data || err);
    res.status(500).send("OAuth failed");
  }
}
