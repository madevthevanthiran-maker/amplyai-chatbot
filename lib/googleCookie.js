// /lib/googleCookie.js
import { serialize } from "cookie";

const COOKIE_NAME = "gauth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setGoogleTokensCookie(res, tokens) {
  const value = Buffer.from(JSON.stringify(tokens)).toString("base64url");
  const cookie = serialize(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,       // Vercel is HTTPS
    sameSite: "lax",    // send on top-level redirects
    path: "/",          // available to all routes
    maxAge: MAX_AGE,
  });
  res.setHeader("Set-Cookie", cookie);
}

export function clearGoogleTokensCookie(res) {
  const cookie = serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", cookie);
}

export function readGoogleTokensCookie(req) {
  const raw = req.headers.cookie || "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    return JSON.parse(Buffer.from(match[1], "base64url").toString());
  } catch {
    return null;
  }
}
