import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Desativa o worker que consome muita RAM no Render
  experimental: {
    webpackBuildWorker: false,
  },

  // Força o Webpack estável para evitar conflitos com Turbopack
  webpack: (config) => {
    return config;
  },

  // Configuração de Imagens corrigida
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },

  // Ignora verificações durante o build para economizar memória e tempo
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configuração ESLint removida - não suportada diretamente no NextConfig 

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;