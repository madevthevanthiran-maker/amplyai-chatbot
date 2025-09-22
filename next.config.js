// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Keep rewrites/redirects EMPTY or make sure they NEVER match /api/**
  async rewrites() {
    return [];
  },
  async redirects() {
    return [];
  },
};

module.exports = nextConfig;
