import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {
    root: path.resolve(__dirname),
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    
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
        hostname: '**.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'beige-web-prod.s3.us-east-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'beige-web-dev.s3.us-east-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
