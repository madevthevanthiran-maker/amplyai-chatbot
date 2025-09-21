// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure nothing rewrites /api/**
  async rewrites() { return []; },
  async redirects() { return []; },
};

module.exports = nextConfig;
