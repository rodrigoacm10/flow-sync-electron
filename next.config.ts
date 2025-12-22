import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // output: 'standalone', // MANTENHA COMENTADO

  // --- ADICIONE ISTO ---
  env: {
    // Isso pega o valor do .env durante o build e "imprime" no código
    JWT_SECRET: process.env.JWT_SECRET,
  },
  // ---------------------

  outputFileTracingIncludes: {
    '*': ['public/**/*', '.next/static/**/*'],
  },
  serverExternalPackages: ['electron', 'better-sqlite3'],
}

export default nextConfig
