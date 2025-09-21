/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mysql2']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuração dinâmica de prefixo baseada em variáveis de ambiente
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  // Garantir que os assets sejam servidos corretamente
  trailingSlash: false,
  // Configuração para servir arquivos estáticos
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
}

module.exports = nextConfig
