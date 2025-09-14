// Robust cookie helpers for storing Google OAuth tokens (refresh + access).
// Handles localhost and production (Vercel/custom domain) correctly.

const COOKIE = "amply_google_tokens";
const YEAR = 365 * 24 * 60 * 60; // seconds

function isHttps(req) {
  const xf = req.headers["x-forwarded-proto"];
  return xf ? xf.includes("https") : false;
}

function sameSite(req) {
  // HTTPS (Vercel, prod) => None; Secure
  // localhost (http)     => Lax
  return isHttps(req) ? "None" : "Lax";
}

export function setTokensCookie(res, req, tokens) {
  const segs = [
    `${COOKIE}=${encodeURIComponent(JSON.stringify(tokens))}`,
    "Path=/",
    `Max-Age=${YEAR}`,
    `SameSite=${sameSite(req)}`,
    "HttpOnly",
  ];
  if (isHttps(req)) segs.push("Secure");
  res.setHeader("Set-Cookie", segs.join("; "));
}

export function clearTokensCookie(res, req) {
  const segs = [
    `${COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    `SameSite=${sameSite(req)}`,
    "HttpOnly",
  ];
  if (isHttps(req)) segs.push("Secure");
  res.setHeader("Set-Cookie", segs.join("; "));
}

export function readTokensFromReq(req) {
  const raw = req.headers.cookie || "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1]));
  } catch {
    return null;
  }
}

export const COOKIE_NAME = COOKIE;
