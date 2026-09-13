import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

// The application connects over the POOLED url. Netlify runs each request in a
// short-lived function, so a direct connection per request would exhaust Neon's
// connection limit quickly; PgBouncer in front absorbs that.
//
// Migrations use DIRECT_URL instead — see prisma.config.ts.
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.')
}

const adapter = new PrismaPg({ connectionString })

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

// Next's dev server re-evaluates modules on every edit; without this each edit
// would open a new pool.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
