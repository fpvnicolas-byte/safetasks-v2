import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Optimize for Railway deployment
  output: 'standalone',

  // Configure webpack aliases
  webpack: (config, { isServer }) => {
    // Configure @ alias to point to src directory
    // This should work in both local and Railway environments
    if (!config.resolve) {
      config.resolve = {};
    }

    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    // Set @ to src directory - this is the standard Next.js way
    config.resolve.alias['@'] = path.join(process.cwd(), 'src');
    // Add lib alias for compatibility with both @/lib and lib/ imports
    config.resolve.alias['lib'] = path.join(process.cwd(), 'src/lib');

    return config;
  },

  // Optimize images
  images: {
    unoptimized: false, // Keep optimization enabled
    domains: ['localhost'],
  },

  // Enable experimental features for better Railway compatibility
  experimental: {
    // Improve build performance
    webpackBuildWorker: false,
  },

  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
