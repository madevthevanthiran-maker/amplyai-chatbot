// middleware.js
import { NextResponse } from "next/server";

// IMPORTANT: exclude ALL API routes and static assets.
// If middleware runs on /api and rewrites to a page, POST will 405.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

export default function middleware() {
  return NextResponse.next();
}
