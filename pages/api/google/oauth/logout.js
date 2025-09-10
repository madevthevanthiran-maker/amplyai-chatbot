// /pages/api/google/oauth/logout.js
import { clearTokens } from "../../../../lib/googleClient";

export default async function handler(req, res) {
  clearTokens(res);
  res.writeHead(302, { Location: "/settings" });
  res.end();
}
