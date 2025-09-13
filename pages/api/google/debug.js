// /pages/api/google/debug.js
// Unified debug endpoint that verifies cookies + tokens written by OAuth callback.
// Safe to expose (does NOT return secrets).
import cookie from "cookie";
import {
  readGoogleTokens,
  GOOGLE_TOKEN_COOKIE,
  GOOGLE_CONNECTED_COOKIE,
} from "@/lib/googleCookie";

export default async function handler(req, res) {
  // --- Env + host info (non-secret) ---
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto =
    (req.headers["x-forwarded-proto"] &&
      String(req.headers["x-forwarded-proto"]).split(",")[0]) ||
    (req.headers.referer && new URL(req.headers.referer).protocol.replace(":", "")) ||
    "https";
  const origin = `${proto}://${host}`;

  const redirectEnv = process.env.GOOGLE_REDIRECT_URI || "";
  const endsWith = (s, suffix) =>
    typeof s === "string" && s.toLowerCase().endsWith(String(suffix).toLowerCase());

  // --- Cookies + token presence ---
  const cookies = cookie.parse(req.headers.cookie || "");
  const tokens = readGoogleTokens(req);

  // Try to import an optional safeDiag() if your repo provides it.
  // If not present, we'll just skip it silently.
  let extraDiag = null;
  try {
    // eslint-disable-next-line global-require
    const { safeDiag } = require("../../../lib/googleClient");
    if (typeof safeDiag === "function") {
      extraDiag = safeDiag();
    }
  } catch (_) {
    // ignore if file or export doesn't exist
  }

  const payload = {
    ok: true,

    env: {
      hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
      hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      redirectUri: redirectEnv,
    },

    host: {
      origin,
      note: "Your OAuth redirect URI must be the SAME host as you're using in the app.",
    },

    cookies: {
      hasTokensCookie: Boolean(cookies[GOOGLE_TOKEN_COOKIE]),
      hasConnectedHint: Boolean(cookies[GOOGLE_CONNECTED_COOKIE]),
      tokensCookieLength: cookies[GOOGLE_TOKEN_COOKIE]?.length || 0,
    },

    tokens: tokens
      ? {
          keys: Object.keys(tokens),
          hasAccessToken: Boolean(tokens.access_token),
          hasRefreshToken: Boolean(tokens.refresh_token),
          expiry_date: tokens.expiry_date || null,
        }
      : null,

    redirectCheck: {
      expected: redirectEnv,
      typical: `${origin}/api/google/oauth/callback`,
      sameHost:
        redirectEnv &&
        host &&
        new URL(redirectEnv).host.toLowerCase() === host.toLowerCase(),
      endsWithCallback: endsWith(redirectEnv, "/api/google/oauth/callback"),
      hint:
        "In Google Cloud Console, OAuth client’s Authorized redirect URI must EXACTLY equal env GOOGLE_REDIRECT_URI.",
    },

    extraDiag: extraDiag || undefined,
    hint:
      "If hasTokensCookie=false after returning from Google, the callback likely didn’t run or wrote a different cookie name. " +
      "We standardize on 'amply_google_tokens'. If sameHost=false, fix GOOGLE_REDIRECT_URI or the domain you use during OAuth.",
  };

  return res.status(200).json(payload);
}
