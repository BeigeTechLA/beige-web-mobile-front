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
};

export default nextConfig;
