import { google } from "googleapis";
import cookie from "cookie";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function getOAuthClient(redirectUri) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(redirectPath = "/settings") {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export function clientWithTokens(tokens) {
  if (!tokens) return null;
  const client = getOAuthClient();
  client.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: client });
}

export function readTokensFromReq(req) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    return cookies.google_tokens ? JSON.parse(cookies.google_tokens) : null;
  } catch {
    return null;
  }
}

export async function ensureFreshTokens(req, res) {
  let tokens = readTokensFromReq(req);
  if (!tokens) return null;

  const client = getOAuthClient();
  client.setCredentials(tokens);

  try {
    const newTokens = await client.getAccessToken();
    if (newTokens && newTokens.token) {
      tokens.access_token = newTokens.token;
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("google_tokens", JSON.stringify(tokens), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      );
    }
    return tokens;
  } catch (err) {
    console.error("ensureFreshTokens error:", err.message);
    return null;
  }
}
