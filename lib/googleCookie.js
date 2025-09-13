// /lib/googleCookie.js
import cookie from "cookie";

export const GOOGLE_TOKEN_COOKIE = "amply_google_tokens";
export const GOOGLE_CONNECTED_COOKIE = "amply_google_connected";

// 180 days
const MAX_AGE = 60 * 60 * 24 * 180;

function sameSiteForEnv() {
  // If you ever embed your app in an iframe on another domain,
  // switch this to "none" so cookies are sent cross-site.
  return process.env.NEXT_PUBLIC_SAMESITE || "lax";
}

export function writeGoogleTokens(res, tokens) {
  const payload = {
    access_token: tokens.access_token || null,
    refresh_token: tokens.refresh_token || null,
    scope: tokens.scope || null,
    token_type: tokens.token_type || "Bearer",
    expiry_date: tokens.expiry_date || null,
    id_token: tokens.id_token || null,
  };

  const set1 = cookie.serialize(
    GOOGLE_TOKEN_COOKIE,
    encodeURIComponent(JSON.stringify(payload)),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: sameSiteForEnv(), // "lax" by default; set to "none" if embedding cross-site
      path: "/",
      maxAge: MAX_AGE,
    }
  );

  const set2 = cookie.serialize(GOOGLE_CONNECTED_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: sameSiteForEnv(),
    path: "/",
    maxAge: MAX_AGE,
  });

  // Preserve existing Set-Cookie header if present
  const prev = res.getHeader("Set-Cookie");
  if (prev) {
    res.setHeader("Set-Cookie", Array.isArray(prev) ? [...prev, set1, set2] : [prev, set1, set2]);
  } else {
    res.setHeader("Set-Cookie", [set1, set2]);
  }
}

export function clearGoogleTokens(res) {
  const cleared1 = cookie.serialize(GOOGLE_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: sameSiteForEnv(),
    path: "/",
    maxAge: 0,
  });
  const cleared2 = cookie.serialize(GOOGLE_CONNECTED_COOKIE, "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: sameSiteForEnv(),
    path: "/",
    maxAge: 0,
  });

  const prev = res.getHeader("Set-Cookie");
  if (prev) {
    res.setHeader("Set-Cookie", Array.isArray(prev) ? [...prev, cleared1, cleared2] : [prev, cleared1, cleared2]);
  } else {
    res.setHeader("Set-Cookie", [cleared1, cleared2]);
  }
}

export function readGoogleTokens(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const raw = cookies[GOOGLE_TOKEN_COOKIE];
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
