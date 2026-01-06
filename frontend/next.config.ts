import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    webpackBuildWorker: false,
  },
  // Isso ajuda o Turbopack a entender os Aliases do tsconfig
  turbopack: {
    resolveAlias: {
      "@/*": ["./src/*"],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;