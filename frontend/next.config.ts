import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // CRITICAL: Configure @ alias for production builds (Render)
    // This ensures @/lib/api resolves correctly in production
    if (!config.resolve) {
      config.resolve = {};
    }

    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    // Set @ alias to src directory - essential for Render builds
    config.resolve.alias['@'] = path.resolve(process.cwd(), 'src');

    // Also set @/* pattern for better compatibility
    config.resolve.alias['@/*'] = path.resolve(process.cwd(), 'src', '*');

    // Ensure src is in modules resolution
    if (!config.resolve.modules) {
      config.resolve.modules = ['node_modules'];
    }

    if (!config.resolve.modules.includes(path.resolve(process.cwd(), 'src'))) {
      config.resolve.modules.unshift(path.resolve(process.cwd(), 'src'));
    }

    return config;
  },
};

export default nextConfig;