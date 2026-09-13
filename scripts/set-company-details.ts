/**
 * Replace the placeholder company details with ANAID's real ones.
 *
 * The first build seeded invented contact details ("Unit 1, Example Industrial
 * Estate, London"). The real ones are published on anaidqualitydisposables.uk
 * and are now the defaults in src/lib/settings.ts — but `db:seed` deliberately
 * never overwrites a stored value, so an existing database keeps the
 * placeholders. This script corrects them.
 *
 *   npx tsx scripts/set-company-details.ts
 *
 * Safe to run repeatedly, and safe to run on a database staff have already
 * edited: a row is only rewritten if it still holds the exact placeholder it
 * was seeded with. Anything else is left alone and reported.
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { SETTING_DEFINITIONS } from '../src/lib/settings'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
})

/** What the first build wrote. Only these values are considered replaceable. */
const PLACEHOLDERS: Record<string, string[]> = {
  'company.email': ['sales@anaid.co.uk'],
  'company.phone': ['020 0000 0000'],
  'company.website': ['https://www.anaid.co.uk'],
  'company.address': ['Unit 1, Example Industrial Estate, London'],
  'company.vatNumber': ['GB000000000'],
  'company.companyNumber': ['00000000'],
  'notifications.adminEmail': ['sales@anaid.co.uk'],
}

async function main() {
  const defaults = new Map(SETTING_DEFINITIONS.map((d) => [d.key as string, String(d.default)]))
  let changed = 0
  let kept = 0

  for (const [key, placeholders] of Object.entries(PLACEHOLDERS)) {
    const row = await prisma.setting.findUnique({ where: { key } })
    if (!row) continue

    const next = defaults.get(key) ?? ''
    if (row.value === next) continue

    if (!placeholders.includes(row.value)) {
      console.log(`  kept     ${key} = ${row.value || '(blank)'} — edited since seeding`)
      kept += 1
      continue
    }

    await prisma.setting.update({ where: { key }, data: { value: next } })
    console.log(`  updated  ${key} = ${next || '(blank)'}`)
    changed += 1
  }

  console.log(`\n${changed} updated, ${kept} left as they were.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
