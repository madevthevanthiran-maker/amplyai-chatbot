// /pages/api/google/oauth/callback.js
import { google } from "googleapis";
import { writeGoogleTokens } from "@/lib/googleCookie";

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    const returnTo = req.query.state ? decodeURIComponent(req.query.state) : "/settings";

    if (!code) {
      const sep = returnTo.includes("?") ? "&" : "?";
      return res.redirect(`${returnTo}${sep}gcb=cancelled`);
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await client.getToken(code);
    writeGoogleTokens(res, tokens);

    const sep = returnTo.includes("?") ? "&" : "?";
    return res.redirect(`${returnTo}${sep}gcb=${Date.now()}`);
  } catch (e) {
    const fallback = "/settings";
    const sep = fallback.includes("?") ? "&" : "?";
    return res.redirect(`${fallback}${sep}gerr=1`);
  }
}
