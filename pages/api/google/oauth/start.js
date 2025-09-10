// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  const returnTo = req.query.returnTo || "/settings";
  const url = getAuthUrl(returnTo);
  res.writeHead(302, { Location: url });
  res.end();
}
