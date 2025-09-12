/**
 * Returns whether the user is connected to Google + their tokens.
 * Compatible with cookies set by our OAuth callback below.
 * If your app already stores tokens elsewhere, keep that code but
 * ensure you still return the same JSON shape.
 *
 * Response (connected):
 *   { connected: true, tokens: { access_token, refresh_token, scope, token_type, expiry_date } }
 * Response (not connected):
 *   { connected: false }
 */

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(/; */).forEach(p => {
    const i = p.indexOf("=");
    if (i < 0) return;
    const k = p.slice(0, i).trim();
    const v = decodeURIComponent(p.slice(i + 1).trim());
    out[k] = v;
  });
  return out;
}

export default async function handler(req, res) {
  try {
    // 1) Preferred cookie name set by our callback below
    const cookies = parseCookies(req.headers.cookie || "");
    const b64 =
      cookies.googleTokens ||            // our new cookie
      cookies.amply_google_tokens || ""; // backward-compat alt name if you used another earlier

    if (!b64) {
      return res.status(200).json({ connected: false });
    }

    // 2) Decode the cookie into tokens
    let tokens = null;
    try {
      // Try base64url first; fallback to normal base64.
      const str = Buffer.from(b64, "base64url").toString("utf8");
      tokens = JSON.parse(str);
    } catch {
      try {
        const str = Buffer.from(b64, "base64").toString("utf8");
        tokens = JSON.parse(str);
      } catch {
        // Corrupt cookie → clear & report disconnected
        res.setHeader(
          "Set-Cookie",
          "googleTokens=; Path=/; Max-Age=0; SameSite=Lax" +
            (process.env.NODE_ENV === "production" ? "; Secure" : "") +
            "; HttpOnly"
        );
        return res.status(200).json({ connected: false });
      }
    }

    // 3) Optional: sanity check minimal fields
    if (!tokens || (!tokens.access_token && !tokens.refresh_token)) {
      return res.status(200).json({ connected: false });
    }

    return res.status(200).json({ connected: true, tokens });
  } catch (e) {
    console.error("[google/status] error", e);
    return res.status(500).json({ error: "Internal error" });
  }
}
