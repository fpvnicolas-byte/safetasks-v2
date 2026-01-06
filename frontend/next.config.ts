import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Ensure src/ directory is included in module resolution
    // This fixes relative path resolution in production builds (Render)
    // In Render, rootDir is 'frontend', so process.cwd() returns 'frontend/'
    const rootDir = process.cwd();
    const srcPath = path.resolve(rootDir, 'src');
    
    // CRITICAL: Configure module resolution to include src/ directory
    // This allows relative imports like '../../../lib/api' to resolve correctly
    // by ensuring Webpack can find modules starting from src/
    if (!config.resolve) {
      config.resolve = {};
    }
    
    // Set modules array - order matters! src/ must come before node_modules
    config.resolve.modules = [
      srcPath,                    // Look in src/ first for relative imports
      path.resolve(rootDir, 'node_modules'),  // Then node_modules
    ];
    
    // Ensure resolve.extensions includes TypeScript files
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    }
    
    // Enable symlinks resolution (may help in some environments)
    config.resolve.symlinks = true;
    
    return config;
  },
};

export default nextConfig;
