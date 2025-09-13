import { google } from "googleapis";

export default async function handler(req, res) {
  const returnTo =
    typeof req.query.returnTo === "string" ? req.query.returnTo : "/chat";

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
  ];

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent", // ensure refresh_token on re-consent
    include_granted_scopes: true,
    state: encodeURIComponent(returnTo),
  });

  res.redirect(url);
}
