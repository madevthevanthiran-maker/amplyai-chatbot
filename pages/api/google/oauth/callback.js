// Replaces the existing callback to PERSIST tokens in a secure cookie.
// No external deps — includes tiny cookie serializer.

import { createOAuth2Client } from "../../../../lib/googleAuth";

function serializeCookie(name, value, {
  httpOnly = true,
  secure = process.env.NODE_ENV === "production",
  sameSite = "lax",
  path = "/",
  maxAge, // seconds
} = {}) {
  const enc = encodeURIComponent;
  let cookie = `${name}=${enc(value)}`;
  if (maxAge != null) cookie += `; Max-Age=${Math.floor(maxAge)}`;
  if (domainFromEnv()) cookie += `; Domain=${domainFromEnv()}`;
  cookie += `; Path=${path}`;
  cookie += `; SameSite=${sameSite}`;
  if (secure) cookie += "; Secure";
  if (httpOnly) cookie += "; HttpOnly";
  return cookie;
}

function domainFromEnv() {
  // Optional: if you have a top-level domain, put it in env GOOGLE_COOKIE_DOMAIN
  // Otherwise return undefined to skip Domain attr (works for localhost + vercel subdomains)
  return process.env.GOOGLE_COOKIE_DOMAIN || undefined;
}

export default async function handler(req, res) {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send("Missing code");

    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);

    // Store tokens in an HttpOnly cookie (1 year). You can switch to DB/session later.
    const payloadB64 = Buffer.from(JSON.stringify(tokens)).toString("base64url");
    res.setHeader("Set-Cookie", serializeCookie("googleTokens", payloadB64, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    }));

    const redirectTo = req.query.state?.startsWith("/") ? req.query.state : "/settings";
    return res.redirect(redirectTo);
  } catch (e) {
    console.error("[google/oauth/callback] error", e?.response?.data || e);
    return res.status(500).send("OAuth failed. Check server logs.");
  }
}
