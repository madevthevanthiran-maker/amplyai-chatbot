// Robust cookie helpers for storing Google tokens.
// Works on Vercel (https), custom domains, and localhost.

const COOKIE_NAME = "amply_google_tokens";
const ONE_YEAR = 365 * 24 * 60 * 60; // seconds

function isHttps(req) {
  const xfProto = req.headers["x-forwarded-proto"];
  return xfProto ? xfProto.includes("https") : false;
}

function sameSiteFor(req) {
  // On HTTPS (Vercel, production), we must use None; Secure
  // On localhost (http), we cannot use None;Secure → use Lax
  return isHttps(req) ? "None" : "Lax";
}

export function writeTokensCookie(res, req, tokens) {
  // DO NOT set Domain explicitly — letting the browser set host-only avoids
  // subdomain issues across *.vercel.app and custom domains.
  const secure = isHttps(req);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(tokens))}`,
    "Path=/",
    `Max-Age=${ONE_YEAR}`,
    `SameSite=${sameSiteFor(req)}`,
  ];
  if (secure) parts.push("Secure");
  // HttpOnly protects from XSS but we also need client-side access in a few places
  // (you’re reading via /api only, so HttpOnly is safe to enable).
  parts.push("HttpOnly");

  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearTokensCookie(res, req) {
  const secure = isHttps(req);
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    `SameSite=${sameSiteFor(req)}`,
  ];
  if (secure) parts.push("Secure");
  parts.push("HttpOnly");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function readTokensFromReq(req) {
  const raw = req.headers.cookie || "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1]));
  } catch {
    return null;
  }
}

export const cookieName = COOKIE_NAME;
