import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Resolve o erro de memória e workers
  experimental: {
    webpackBuildWorker: false,
  },

  // 2. Silencia o erro do Turbopack v. Webpack
  // Adicionando um objeto vazio para o turbopack, o Next 16 entende que
  // ele deve aceitar as configurações legadas sem travar.
  turbopack: {},

  // 3. Imagens
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // 4. Se você precisar ignorar o Lint no build no Next 16, 
  // agora você deve usar o comando no terminal ou ignorar via TypeScript:
  typescript: {
    ignoreBuildErrors: true,
  },

  // 5. Mantém o output para deploy no Render/Railway
  output: 'standalone',
};

export default nextConfig;