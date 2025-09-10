// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  const state = (req.query.state || "/settings").toString();
  const url = getAuthUrl(req, state);
  return res.redirect(302, url);
}
