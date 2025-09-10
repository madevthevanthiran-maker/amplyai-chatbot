// /pages/api/google/oauth/logout.js
import { clearTokensCookie } from "../../../../lib/googleClient";

export default function handler(req, res) {
  clearTokensCookie(res);
  const next = typeof req.query.next === "string" ? req.query.next : "/settings";
  res.redirect(302, next);
}
