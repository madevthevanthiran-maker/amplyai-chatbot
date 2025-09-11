import { serialize, parse } from "cookie";

const COOKIE_NAME = "gauth";
const ONE_WEEK = 7 * 24 * 60 * 60; // seconds

export function getSession(req) {
  const cookies = req.headers?.cookie ? parse(req.headers.cookie) : {};
  try {
    return cookies[COOKIE_NAME] ? JSON.parse(cookies[COOKIE_NAME]) : null;
  } catch {
    return null;
  }
}

export function setSession(res, data) {
  res.setHeader("Set-Cookie", serialize(
    COOKIE_NAME,
    JSON.stringify(data || {}),
    {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: ONE_WEEK,
    }
  ));
}

export function clearSession(res) {
  res.setHeader("Set-Cookie", serialize(COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 0,
  }));
}
