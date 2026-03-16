import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],

    deviceSizes: [320, 384, 420, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    
    minimumCacheTTL: 31536000, 

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
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'beige-web-prod.s3.us-east-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;