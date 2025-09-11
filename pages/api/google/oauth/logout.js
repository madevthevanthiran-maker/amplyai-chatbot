// /pages/api/google/oauth/logout.js
export default function handler(_req, res) {
  // Clear cookie
  res.setHeader(
    "Set-Cookie",
    `gcal_tok=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; ${
      process.env.NODE_ENV !== "development" ? "Secure;" : ""
    }`
  );
  res.writeHead(302, { Location: "/settings" });
  res.end();
}
