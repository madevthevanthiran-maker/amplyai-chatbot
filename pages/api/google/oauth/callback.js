// /pages/api/google/oauth/callback.js
import { exchangeCodeAndStore } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) throw new Error("Missing ?code");
    const returnTo = typeof state === "string" && state ? state : "/settings";

    await exchangeCodeAndStore(req, res, String(code));
    res.writeHead(302, { Location: `${returnTo}?gcb=1` });
    res.end();
  } catch (err) {
    res
      .status(400)
      .send(`OAuth callback error: ${String(err?.message || err)}`);
  }
}
