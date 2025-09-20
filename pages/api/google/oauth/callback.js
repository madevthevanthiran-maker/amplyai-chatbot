// /pages/api/google/oauth/callback.js
import { getOAuthClient, writeTokenCookie } from "@/lib/googleClient";

export default async function handler(req, res) {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing ?code");

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    writeTokenCookie(res, tokens);

    // Simple success page to close the popup
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`
      <html>
        <body style="background:#0b0f19;color:#e5e7eb;font-family:Inter,system-ui;padding:24px">
          <h2>Google connected 🎉</h2>
          <p>You can close this tab.</p>
          <script>setTimeout(() => window.close(), 800);</script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send("OAuth callback error: " + String(err));
  }
}
