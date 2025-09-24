// /pages/api/google/oauth/start.js
import { oauth2Client, PROD_ORIGIN } from "@/lib/googleClient";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  const returnTo =
    (req.query.returnTo && String(req.query.returnTo)) || `${PROD_ORIGIN}/settings`;

  const o = oauth2Client();
  const url = o.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ],
    state: Buffer.from(JSON.stringify({ returnTo })).toString("base64"),
  });

  res.writeHead(302, { Location: url });
  res.end();
}
