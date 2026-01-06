import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  // Desativa o worker que consome muita RAM no Render
  experimental: {
    webpackBuildWorker: false,
  },

  // Configuração Turbopack para resolver conflitos com webpack
  turbopack: {},

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

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;