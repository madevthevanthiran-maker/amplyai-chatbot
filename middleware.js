// middleware.js
// If you use middleware, exclude API routes to avoid 405s on POSTs.
export const config = {
  matcher: [
    // match everything EXCEPT /api and static assets
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

export default function middleware() {
  // no-op (or your existing logic) – most important is the matcher above
  return;
}
