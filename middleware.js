// /middleware.js
import { NextResponse } from "next/server";

const PROD_HOST = "amplyai-chatbot.vercel.app";

export function middleware(req) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";

  // Allow localhost / 127.0.0.1 for dev
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return NextResponse.next();
  }

  // If already on production host, proceed
  if (host === PROD_HOST) return NextResponse.next();

  // Redirect all other hosts (including Vercel previews) to production
  url.host = PROD_HOST;
  url.protocol = "https:";
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
