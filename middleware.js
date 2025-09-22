// middleware.js
import { NextResponse } from "next/server";

/**
 * IMPORTANT:
 * - Do NOT run middleware on /api/** or on static assets.
 * - If you have other logic (auth, locales, etc.), keep it here,
 *   but DO NOT change the matcher below.
 */
export const config = {
  matcher: [
    // Everything EXCEPT:
    // - /api/**
    // - Next.js static assets
    // - common public assets
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|humans.txt).*)',
  ],
};

export default function middleware() {
  // If you had redirect/rewrites for pages, keep them here.
  return NextResponse.next();
}
