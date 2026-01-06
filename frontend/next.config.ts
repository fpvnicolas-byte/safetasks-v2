import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Configure @ alias to point to src directory
    // This should work in both local and Render environments
    if (!config.resolve) {
      config.resolve = {};
    }

    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    // Set @ to src directory - this is the standard Next.js way
    config.resolve.alias['@'] = path.join(process.cwd(), 'src');

    return config;
  },
};

export default nextConfig;