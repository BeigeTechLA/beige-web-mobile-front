import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during build for UI-only migration
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build for UI-only migration
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
    ],
  },
};

export default nextConfig;
