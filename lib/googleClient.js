import { google } from "googleapis";
import cookie from "cookie";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// Utility: create OAuth2 client
export function oauth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Generate login URL
export function googleAuthUrl() {
  const client = oauth2Client();
  return client.generateAuthUrl({
    access_type: "offline", // ⬅️ ensures refresh_token
    prompt: "consent",      // ⬅️ forces refresh_token every time
    scope: SCOPES,
  });
}

// Hydrate from cookies
export async function hydrateClientFromCookie(req, res) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const tokens = cookies.googleTokens ? JSON.parse(cookies.googleTokens) : null;

  if (!tokens) return { oauth2: null, ready: false };

  const client = oauth2Client();
  client.setCredentials(tokens);

  // Auto-refresh if expired
  client.on("tokens", (newTokens) => {
    const merged = { ...tokens, ...newTokens };
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("googleTokens", JSON.stringify(merged), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    );
  });

  return { oauth2: client, ready: true };
}

// Calendar client
export function calendarClient(auth) {
  return google.calendar({ version: "v3", auth });
}

// Diagnostics
export function safeDiag() {
  return {
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    clientId: process.env.GOOGLE_CLIENT_ID ? "set" : "MISSING",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "set" : "MISSING",
  };
}
