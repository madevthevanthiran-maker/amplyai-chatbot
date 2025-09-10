// /pages/api/google/oauth/logout.js
import { clearTokensCookie } from "../../../../lib/googleClient";

export default function handler(req, res) {
  clearTokensCookie(res);
  res.redirect(302, "/settings");
}
