// /lib/googleClient.js
import { google } from "googleapis";
import { serialize, parse } from "cookie";

/**
 * Single place to:
 *  - build OAuth2 client from envs
 *  - read/write tokens from cookies
 *  - expose a small status/diag helper
 */

const REQUIRED_ENVS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "JWT_SECRET", // used for cookie signing if you later want to encrypt; not required here
];

function envOk() {
  return REQUIRED_ENVS.every((k) => process.env[k]);
}

export function newOAuthClient() {
  if (!envOk()) throw new Error("Missing Google OAuth env vars.");
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/** Cookie names (scoped; adjust if you already use different names) */
const CK = {
  ACCESS: "pp_gcal_access",
  REFRESH: "pp_gcal_refresh",
  EXP: "pp_gcal_exp",
};

/** Read tokens from request cookies */
export function readTokensFromReq(req) {
  const cookies = req?.headers?.cookie ? parse(req.headers.cookie) : {};
  const access_token = cookies[CK.ACCESS] || null;
  const refresh_token = cookies[CK.REFRESH] || null;
  const expiry_date = cookies[CK.EXP] ? Number(cookies[CK.EXP]) : null;
  return { access_token, refresh_token, expiry_date };
}

/** Write tokens as secure cookies on the response */
export function writeTokensToRes(res, { access_token, refresh_token, expiry_date }) {
  const base = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  const jar = [];

  if (access_token) {
    jar.push(
      serialize(CK.ACCESS, access_token, {
        ...base,
        maxAge: 60 * 60, // 1h
      })
    );
  }
  if (refresh_token) {
    // refresh token can live long; keep ~90 days
    jar.push(
      serialize(CK.REFRESH, refresh_token, {
        ...base,
        maxAge: 60 * 60 * 24 * 90,
      })
    );
  }
  if (expiry_date) {
    jar.push(
      serialize(CK.EXP, String(expiry_date), {
        ...base,
        maxAge: 60 * 60,
      })
    );
  }

  if (jar.length) res.setHeader("Set-Cookie", jar);
}

/** Clear all OAuth cookies */
export function clearTokenCookies(res) {
  const dead = (name) =>
    serialize(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  res.setHeader("Set-Cookie", [dead(CK.ACCESS), dead(CK.REFRESH), dead(CK.EXP)]);
}

/** Build an auth client preloaded from cookies and with refresh flow wired. */
export function oauthFromCookies(req, res) {
  const client = newOAuthClient();
  const { access_token, refresh_token, expiry_date } = readTokensFromReq(req);

  if (access_token || refresh_token) {
    client.setCredentials({
      access_token: access_token || undefined,
      refresh_token: refresh_token || undefined,
      expiry_date: expiry_date || undefined,
    });

    // When googleapis refreshes, persist the new tokens
    client.on("tokens", (tokens) => {
      const merged = {
        access_token: tokens.access_token || access_token,
        refresh_token: tokens.refresh_token || refresh_token,
        expiry_date: tokens.expiry_date || Date.now() + 50 * 60 * 1000,
      };
      writeTokensToRes(res, merged);
    });
  }

  return client;
}

/** Small status object for /api/google/status or /api/google/debug */
export function safeDiag(req) {
  const ok = envOk();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || null;
  const { access_token, refresh_token, expiry_date } = readTokensFromReq(req);
  return {
    envOk: ok,
    redirectUri,
    hasAccess: Boolean(access_token),
    hasRefresh: Boolean(refresh_token),
    expiry_date: expiry_date || null,
  };
}
