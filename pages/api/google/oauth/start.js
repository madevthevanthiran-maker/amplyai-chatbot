// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../lib/googleClient";

export default async function handler(req, res) {
  const state = typeof req.query.state === "string" ? req.query.state : "/settings";
  const url = getAuthUrl(state);
  // Always redirect to PROD auth URL (because getAuthUrl uses APP_URL)
  res.writeHead(302, { Location: url });
  res.end();
}
