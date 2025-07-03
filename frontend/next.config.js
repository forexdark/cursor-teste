/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['http2.mlstatic.com'],
  },
};

module.exports = nextConfig;
