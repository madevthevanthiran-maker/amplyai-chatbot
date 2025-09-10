// /pages/api/google/oauth/logout.js
import { clearTokens, absoluteUrl } from "../../../../lib/googleClient";

export default function handler(req, res) {
  clearTokens(res);
  res.writeHead(302, { Location: absoluteUrl("/settings") });
  res.end();
}
