import { createAuthUrl } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  const { returnTo = "/settings" } = req.query;
  const state = Buffer.from(
    JSON.stringify({ returnTo }),
    "utf8"
  ).toString("base64url");

  const url = createAuthUrl(state);
  res.redirect(url);
}
