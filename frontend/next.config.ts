import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    webpackBuildWorker: false,
  },
  // O Turbopack no Render precisa saber onde a src está
  // relativa ao diretório de execução (frontend/)
  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname, "src"),
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
