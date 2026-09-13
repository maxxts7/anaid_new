// Prisma 7 no longer reads .env automatically, and no longer takes the CLI's
// connection string from the schema. Both are set here.
//
// Migrations run over DIRECT_URL — a session-mode connection. PgBouncer's
// transaction mode cannot hold the advisory locks `migrate` relies on.
// The application itself connects over the pooled DATABASE_URL, via the driver
// adapter in src/lib/db.ts.
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DIRECT_URL'),
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
