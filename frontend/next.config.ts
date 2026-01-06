import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Ensure @ alias works in all environments including Render
    if (!config.resolve.alias['@']) {
      config.resolve.alias['@'] = './src';
    }
    return config;
  },
  // Ensure tsconfig paths are used
  experimental: {
    // Force webpack to use tsconfig paths
  },
};

export default nextConfig;
