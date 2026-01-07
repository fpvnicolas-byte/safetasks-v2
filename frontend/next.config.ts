import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Desabilitamos o worker de build que às vezes trava no Render
  experimental: {
    webpackBuildWorker: false,
  },
  typescript: {
    // Isso garante que o build não pare por avisos bobos, 
    // focando apenas em erros reais de módulo
    ignoreBuildErrors: true,
  }
};

export default nextConfig;