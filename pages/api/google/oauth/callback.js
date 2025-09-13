import { google } from "googleapis";
import { writeGoogleTokens } from "@/lib/googleCookie";

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    const returnTo = req.query.state
      ? decodeURIComponent(req.query.state)
      : "/chat";

    if (!code) {
      // user cancelled?
      return res.redirect(`${returnTo}?gcb=cancelled`);
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await client.getToken(code);
    // Persist tokens in our standardized cookie
    writeGoogleTokens(res, tokens);

    // Cache-buster so the UI refetches /api/google/status immediately
    const bust = `gcb=${Date.now()}`;
    const sep = returnTo.includes("?") ? "&" : "?";
    return res.redirect(`${returnTo}${sep}${bust}`);
  } catch (e) {
    // Best-effort safe redirect with error info stripped
    const fallback = "/settings";
    const sep = fallback.includes("?") ? "&" : "?";
    return res.redirect(`${fallback}${sep}gerr=1`);
  }
}
