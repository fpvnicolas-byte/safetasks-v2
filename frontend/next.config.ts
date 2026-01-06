import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Add alias for @ to point to src directory
    config.resolve.alias['@'] = config.resolve.alias['@'] || './src';
    return config;
  },
};

export default nextConfig;
