// /pages/api/google/oauth/logout.js
import { clearTokenCookies } from "../../../../lib/googleClient";

export default function handler(req, res) {
  clearTokenCookies(res);
  res.redirect(302, "/settings");
}
