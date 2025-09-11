// /pages/api/google/oauth/callback.js
import { getOAuthClient } from "../../../../lib/googleClient";

// Minimal cookie helpers (no extra deps)
function setCookie(res, name, value, { maxAgeSec = 60 * 60 * 24 * 365 } = {}) {
  const cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAgeSec}`,
    // only set Secure in production to keep local dev easy; flip on if you want always
    process.env.NODE_ENV !== "development" ? `Secure` : null,
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method Not Allowed");
  }

  const { code, state = "/settings" } = req.query || {};
  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing ?code");
  }

  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    // Store tokens in an httpOnly cookie
    setCookie(res, "gcal_tok", JSON.stringify(tokens));

    // Go back to where the flow started (usually /settings)
    const dest = typeof state === "string" ? state : "/settings";
    res.writeHead(302, { Location: dest });
    res.end();
  } catch (err) {
    // Helpful HTML for quick debugging
    res.status(400).send(
      `Token exchange failed.<br><b>Most common cause:</b> Redirect URI mismatch.` +
        `<br><br><pre>${JSON.stringify(
          { message: err?.message || String(err), query: req.query },
          null,
          2
        )}</pre>`
    );
  }
}
