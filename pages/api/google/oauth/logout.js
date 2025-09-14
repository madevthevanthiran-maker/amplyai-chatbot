import { clearTokensCookie } from "../../../../lib/googleCookie";

export default function handler(req, res) {
  const { returnTo = "/settings" } = req.query;
  clearTokensCookie(res, req);
  res.redirect(302, returnTo);
}
