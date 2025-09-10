// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  const from = typeof req.query.from === "string" ? req.query.from : "/settings";
  const url = getAuthUrl(from);
  return res.redirect(url);
}
