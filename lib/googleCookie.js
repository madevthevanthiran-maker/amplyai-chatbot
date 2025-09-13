// Central place to write/read Google OAuth tokens as cookies
import cookie from "cookie";

export const GOOGLE_TOKEN_COOKIE = "amply_google_tokens";
export const GOOGLE_CONNECTED_COOKIE = "amply_google_connected";

// 180 days
const MAX_AGE = 60 * 60 * 24 * 180;

export function writeGoogleTokens(res, tokens) {
  // We only store the minimal fields we need.
  const payload = {
    access_token: tokens.access_token || null,
    refresh_token: tokens.refresh_token || null,
    scope: tokens.scope || null,
    token_type: tokens.token_type || "Bearer",
    expiry_date: tokens.expiry_date || null,
    id_token: tokens.id_token || null,
  };

  const serialized = cookie.serialize(
    GOOGLE_TOKEN_COOKIE,
    encodeURIComponent(JSON.stringify(payload)),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    }
  );

  const connected = cookie.serialize(GOOGLE_CONNECTED_COOKIE, "1", {
    httpOnly: false, // presence hint for client UIs if needed
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  res.setHeader("Set-Cookie", [serialized, connected]);
}

export function clearGoogleTokens(res) {
  const cleared = cookie.serialize(GOOGLE_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  const cleared2 = cookie.serialize(GOOGLE_CONNECTED_COOKIE, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", [cleared, cleared2]);
}

export function readGoogleTokens(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  if (!cookies[GOOGLE_TOKEN_COOKIE]) return null;
  try {
    return JSON.parse(decodeURIComponent(cookies[GOOGLE_TOKEN_COOKIE]));
  } catch {
    try {
      return JSON.parse(cookies[GOOGLE_TOKEN_COOKIE]);
    } catch {
      return null;
    }
  }
}
