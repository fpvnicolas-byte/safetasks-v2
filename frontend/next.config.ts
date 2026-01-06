import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Desativa workers paralelos que consomem muita RAM no Render Free
    webpackBuildWorker: false,
  },
  // Configuração específica para o Turbopack resolver os Aliases no Linux
  turbopack: {
    resolveAlias: {
      "@/*": ["src/*"],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;