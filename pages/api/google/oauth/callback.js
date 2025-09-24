// /pages/api/google/oauth/callback.js
import { oauth2Client, setAuthCookie, PROD_ORIGIN } from "@/lib/googleClient";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { code, state } = req.query || {};
  if (!code) return res.status(400).send("Missing code");

  const returnTo = (() => {
    try {
      const s = JSON.parse(Buffer.from(String(state || ""), "base64").toString("utf8"));
      return typeof s.returnTo === "string" && s.returnTo ? s.returnTo : `${PROD_ORIGIN}/settings`;
    } catch {
      return `${PROD_ORIGIN}/settings`;
    }
  })();

  try {
    const o = oauth2Client();
    const { tokens } = await o.getToken(String(code));
    setAuthCookie(res, tokens);
    res.writeHead(302, { Location: returnTo });
    res.end();
  } catch (e) {
    res.status(500).send("Token exchange failed: " + (e.message || String(e)));
  }
}
