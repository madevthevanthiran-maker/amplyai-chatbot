// /lib/googleClient.js
import { google } from "googleapis";
import cookie from "cookie";

export const PROD_ORIGIN = "https://amplyai-chatbot.vercel.app";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI = `${PROD_ORIGIN}/api/google/oauth/callback`,
} = process.env;

export const cookieName = "gauth";

export function oauth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function setAuthCookie(res, tokens) {
  const value = Buffer.from(JSON.stringify(tokens)).toString("base64");
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(cookieName, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      domain: "amplyai-chatbot.vercel.app",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  );
}

export function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      domain: "amplyai-chatbot.vercel.app",
      maxAge: 0,
    })
  );
}

export function readAuthCookie(req) {
  const c = cookie.parse(req.headers.cookie || "");
  const raw = c[cookieName];
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function calendarClient(tokens) {
  const o = oauth2Client();
  if (tokens) o.setCredentials(tokens);
  return google.calendar({ version: "v3", auth: o });
}
