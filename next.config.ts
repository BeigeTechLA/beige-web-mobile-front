import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  eslint: {
    // Ignore ESLint errors during build for UI-only migration
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build for UI-only migration
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "revure-api.beige.app",
      },
      {
        protocol: "https",
        hostname: "beigexmemehouse.s3.amazonaws.com",
      },
      {
        protocol: 'https',
        hostname: 'd2jhn32fsulyac.cloudfront.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'beige-web-prod.s3.us-east-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd2jhn32fsulyac.cloudfront.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
