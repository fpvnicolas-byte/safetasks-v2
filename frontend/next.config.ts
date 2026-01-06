import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    const rootDir = process.cwd();
    const srcPath = path.resolve(rootDir, 'src');
    
    if (!config.resolve) {
      config.resolve = {};
    }
    
    // DEFINITIVE SOLUTION: Configure @/ alias to match tsconfig.json
    // This ensures imports like @/lib/api work in both TypeScript and Webpack
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    config.resolve.alias['@'] = srcPath;
    
    // Keep modules resolution as fallback
    config.resolve.modules = [
      srcPath,
      path.resolve(rootDir, 'node_modules'),
    ];
    
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js', '.json'];
    }
    
    return config;
  },
};

export default nextConfig;
