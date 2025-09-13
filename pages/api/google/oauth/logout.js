import { clearGoogleTokens } from "@/lib/googleCookie";

export default async function handler(req, res) {
  clearGoogleTokens(res);
  const to = typeof req.query.returnTo === "string" ? req.query.returnTo : "/settings";
  const sep = to.includes("?") ? "&" : "?";
  return res.redirect(`${to}${sep}loggedOut=1`);
}
