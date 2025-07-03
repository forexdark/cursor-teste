/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['http2.mlstatic.com', 'mlstatic.com', 'via.placeholder.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,
  reactStrictMode: true,
  output: 'standalone',
};

module.exports = nextConfig;