import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Ensure src/ directory is included in module resolution
    // This fixes relative path resolution in production builds (Render)
    config.resolve.modules = [
      path.resolve(__dirname, 'src'),
      ...(config.resolve.modules || []),
    ];
    
    return config;
  },
};

export default nextConfig;
