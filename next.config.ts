import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The generated Prisma client is Node-only; keep it out of the bundler's
  // module graph so Netlify's function build doesn't try to trace it twice.
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],

  images: {
    remotePatterns: [
      // Product images are seeded as remote placeholders until real photography
      // is uploaded. Replace with the eventual image host.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  typedRoutes: true,
}

export default nextConfig
