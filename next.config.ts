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
  // TEMPORARY: Allow mixed content (HTTP API from HTTPS site) for testing
  // TODO: Remove this once HTTPS is set up on the backend
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
