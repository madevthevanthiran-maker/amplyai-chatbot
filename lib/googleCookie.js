// /lib/googleCookie.js
// Helper for reading/writing Google OAuth tokens from a signed cookie.

const COOKIE_NAME = "gauth"; // keep consistent with your start/callback routes

// Read tokens (access + refresh) from cookie (unsigned JSON for simplicity here).
// If you sign/encrypt in your project, adapt the parse accordingly.
export function readGoogleTokens(req) {
  try {
    const cookie = req.headers?.cookie || "";
    const pair = cookie
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(`${COOKIE_NAME}=`));
    if (!pair) return null;

    const raw = decodeURIComponent(pair.slice(COOKIE_NAME.length + 1));
    const data = JSON.parse(raw);
    // Expect { access_token, refresh_token, expiry_date, scope, token_type }
    if (!data || !data.access_token) return null;
    return data;
  } catch {
    return null;
  }
}

// Write tokens back to the cookie (HTTP-only in production via Next API).
export function writeGoogleTokens(res, tokens, { maxAgeSec = 60 * 60 * 24 * 30 } = {}) {
  const value = encodeURIComponent(JSON.stringify(tokens || {}));
  const parts = [
    `${COOKIE_NAME}=${value}`,
    `Path=/`,
    `Max-Age=${maxAgeSec}`,
    `SameSite=Lax`,
  ];
  // Mark secure + httpOnly on production
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
    parts.push("HttpOnly");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

// Clear cookie on logout
export function clearGoogleTokens(res) {
  const parts = [
    `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`,
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
    parts.push("HttpOnly");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}
