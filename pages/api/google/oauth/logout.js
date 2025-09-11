// /pages/api/google/oauth/logout.js
import { clearTokensCookie } from "../../../../lib/googleClient";

export default function handler(req, res) {
  clearTokensCookie(res);
  // Back to settings after disconnect
  res.writeHead(302, { Location: "/settings" });
  res.end();
}
