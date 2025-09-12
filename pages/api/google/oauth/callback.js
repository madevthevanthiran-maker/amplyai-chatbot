/**
 * OAuth callback that PERSISTS Google tokens in a secure HttpOnly cookie.
 * It is compatible with /api/google/status.js above.
 * Does not remove any of your other OAuth routes or logic.
 */

import { createOAuth2Client } from "../../../../lib/googleAuth";

// Tiny cookie serializer (no deps)
function serializeCookie(name, value, {
  httpOnly = true,
  secure = process.env.NODE_ENV === "production",
  sameSite = "lax",
  path = "/",
  maxAge, // seconds
  domain,
} = {}) {
  const enc = encodeURIComponent;
  let cookie = `${name}=${enc(value)}`;
  if (maxAge != null) cookie += `; Max-Age=${Math.floor(maxAge)}`;
  if (domain) cookie += `; Domain=${domain}`;
  cookie += `; Path=${path}`;
  cookie += `; SameSite=${sameSite}`;
  if (secure) cookie += "; Secure";
  if (httpOnly) cookie += "; HttpOnly";
  return cookie;
}

function cookieDomain() {
  // Optional: set GOOGLE_COOKIE_DOMAIN=yourdomain.com if you want the cookie shared across subdomains.
  return process.env.GOOGLE_COOKIE_DOMAIN || undefined;
}

export default async function handler(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("Missing code");

    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);

    // Persist tokens in secure HttpOnly cookie (1 year)
    const payloadB64 = Buffer.from(JSON.stringify(tokens)).toString("base64url");
    res.setHeader("Set-Cookie", serializeCookie("googleTokens", payloadB64, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      domain: cookieDomain(),
    }));

    // Redirect back to a safe place (state preferred if starts with '/')
    const redirectTo = (state && state.startsWith("/")) ? state : "/settings";
    return res.redirect(redirectTo);
  } catch (e) {
    console.error("[google/oauth/callback] error", e?.response?.data || e);
    return res.status(500).send("OAuth failed. Check server logs.");
  }
}
