import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Experimental config to help with path resolution in production
  experimental: {
    outputFileTracingRoot: path.resolve(process.cwd(), 'src'),
  },

  webpack: (config, { isServer }) => {
    // Configure @ alias using the standard Next.js approach
    if (!config.resolve) {
      config.resolve = {};
    }

    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    // Set @ to point to src directory - this should work in Render
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');

    // Also set the @/* pattern
    config.resolve.alias['@/*'] = path.resolve(__dirname, 'src', '/*');

    // Make sure src is in the modules array
    if (!config.resolve.modules) {
      config.resolve.modules = ['node_modules'];
    }

    // Add src at the beginning of modules array
    const srcPath = path.resolve(__dirname, 'src');
    if (!config.resolve.modules.includes(srcPath)) {
      config.resolve.modules.unshift(srcPath);
    }

    return config;
  },
};

export default nextConfig;