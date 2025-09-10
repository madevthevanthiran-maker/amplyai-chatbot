// /pages/api/google/oauth/start.js
import { getAuthUrl } from "../../../../lib/googleClient";

export default function handler(req, res) {
  const state = typeof req.query.state === "string" ? req.query.state : "/settings";
  const url = getAuthUrl(state);
  res.writeHead(302, { Location: url });
  res.end();
}
