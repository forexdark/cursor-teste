/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    appDir: true
  },
  images: {
    domains: ['http2.mlstatic.com', 'mlstatic.com'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://vigia-meli.up.railway.app',
  },
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  swcMinify: true,
  reactStrictMode: true
};

module.exports = nextConfig;