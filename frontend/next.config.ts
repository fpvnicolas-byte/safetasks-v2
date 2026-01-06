import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // In Render, rootDir is 'frontend', so process.cwd() returns 'frontend/'
    const rootDir = process.cwd();
    const srcPath = path.resolve(rootDir, 'src');
    
    if (!config.resolve) {
      config.resolve = {};
    }
    
    // CRITICAL: Configure @/ alias to match tsconfig.json paths
    // Webpack 5 requires explicit alias configuration
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Set alias - @ points to src/ directory
    // This is the KEY configuration that makes @/lib/api work
    config.resolve.alias['@'] = srcPath;
    
    // Also configure the pattern @/* for better compatibility
    // Some Webpack versions need this explicit pattern matching
    config.resolve.alias['@/*'] = path.join(srcPath, '*');
    
    // CRITICAL: Configure modules resolution
    // Webpack needs to look in src/ when resolving @/ imports
    // The order matters - src/ must come before node_modules
    if (!Array.isArray(config.resolve.modules)) {
      config.resolve.modules = ['node_modules'];
    }
    
    // Ensure src/ is in modules array (if not already)
    if (!config.resolve.modules.includes(srcPath)) {
      config.resolve.modules = [srcPath, ...config.resolve.modules];
    }
    
    // Ensure extensions are configured
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    }
    
    return config;
  },
};

export default nextConfig;
