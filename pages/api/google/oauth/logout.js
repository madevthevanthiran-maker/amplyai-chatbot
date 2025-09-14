import { clearTokensCookie } from "../../../../lib/googleCookie";

export default async function handler(req, res) {
  clearTokensCookie(res, req);
  const { returnTo = "/settings" } = req.query;
  res.redirect(returnTo);
}
