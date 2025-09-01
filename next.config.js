/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Do not run ESLint during `next build` on Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
