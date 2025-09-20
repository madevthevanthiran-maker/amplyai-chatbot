// /pages/api/google/oauth/logout.js
import cookie from "cookie";

export default function handler(req, res) {
  try {
    const name = process.env.APP_COOKIE_NAME || "amply_google";
    res.setHeader(
      "Set-Cookie",
      cookie.serialize(name, "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      })
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false, error: e.message });
  }
}
