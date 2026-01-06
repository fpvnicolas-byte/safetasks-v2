import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // In Render, rootDir is 'frontend', so process.cwd() returns 'frontend/'
    // This is the most reliable way to get the root directory
    const rootDir = process.cwd();
    const srcPath = path.resolve(rootDir, 'src');
    
    if (!config.resolve) {
      config.resolve = {};
    }
    
    // CRITICAL: Configure @/ alias to match tsconfig.json paths
    // This MUST be set correctly for Webpack to resolve @/ imports
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Set alias - @ points to src/ directory
    // So @/lib/api resolves to src/lib/api
    config.resolve.alias['@'] = srcPath;
    
    // CRITICAL: Configure modules resolution
    // Webpack needs to look in src/ when resolving @/ imports
    // The order matters - src/ must come before node_modules
    const existingModules = Array.isArray(config.resolve.modules) 
      ? config.resolve.modules 
      : ['node_modules'];
    
    // Remove srcPath if it already exists to avoid duplicates
    const filteredModules = existingModules.filter((m: string) => m !== srcPath);
    
    config.resolve.modules = [
      srcPath,        // Look in src/ first (CRITICAL for @/ imports)
      ...filteredModules,
    ];
    
    // Ensure extensions are configured
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    }
    
    return config;
  },
};

export default nextConfig;
