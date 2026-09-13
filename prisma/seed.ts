/**
 * Seed.
 *
 * Safe to run repeatedly: everything here upserts, and existing settings values
 * are never overwritten with defaults.
 *
 * The catalogue is ANAID's own, imported from anaidqualitydisposables.uk by
 * scripts/import-anaid-shop.mjs — real products, categories, pack sizes and
 * photography. Prices are the one thing that is NOT real: the live site carries
 * placeholder pricing, so list prices here are derived estimates to be replaced
 * in the admin.
 */
import 'dotenv/config'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { SETTING_DEFINITIONS, serialise } from '../src/lib/settings'

const here = dirname(fileURLToPath(import.meta.url))

const prisma = new PrismaClient({
  // Seeding is a one-off administrative task; use the session-mode connection.
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
})

type SeedData = {
  categories: {
    name: string
    slug: string
    description: string | null
    sortOrder: number
    active: boolean
    parentSlug: string | null
    image?: string | null
  }[]
  products: {
    sku: string
    name: string
    slug: string
    description: string | null
    categorySlug: string
    barcode: string | null
    brand: string | null
    size: string | null
    material: string | null
    colour: string | null
    packSize: string | null
    unitsPerCarton: number
    cartonQuantity: number
    minOrderQuantity: number
    standardPricePence: number
    vatRateBasisPoints: number
    stockOnHand: number
    lowStockThreshold: number
    trackStock: boolean
    featured: boolean
    active: boolean
    weightGrams: number | null
    dimensions: string | null
    /** Where this record came from on the live site. Not stored. */
    sourceUrl?: string | null
  }[]
  pricingLevels: {
    code: string
    name: string
    discountBasisPoints: number
    isDefault: boolean
    sortOrder: number
    active: boolean
  }[]
  quantityBreaks: { sku: string; minQuantity: number; pricePence: number }[]
}

const data: SeedData = JSON.parse(readFileSync(join(here, 'seed-data.json'), 'utf8'))

/** Photography downloaded from the live site by scripts/import-anaid-shop.mjs. */
const productImages: Record<string, { file: string; alt: string }> = existsSync(
  join(here, 'seed-images.json')
)
  ? JSON.parse(readFileSync(join(here, 'seed-images.json'), 'utf8'))
  : {}

const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD ?? 'ChangeMe!2026'

async function seedSettings() {
  for (const definition of SETTING_DEFINITIONS) {
    await prisma.setting.upsert({
      where: { key: definition.key },
      // Never clobber a value an administrator has already changed.
      update: {
        label: definition.label,
        description: 'description' in definition ? definition.description : null,
        group: definition.group,
        type: definition.kind,
      },
      create: {
        key: definition.key,
        value: serialise(definition.default),
        type: definition.kind,
        group: definition.group,
        label: definition.label,
        description: 'description' in definition ? definition.description : null,
      },
    })
  }
  console.log(`  settings        ${SETTING_DEFINITIONS.length}`)
}

async function seedPricingLevels() {
  for (const level of data.pricingLevels) {
    await prisma.pricingLevel.upsert({
      where: { code: level.code },
      update: { name: level.name, sortOrder: level.sortOrder, active: level.active },
      create: level,
    })
  }
  console.log(`  pricing levels  ${data.pricingLevels.length}`)
}

async function seedCategories() {
  // Parents first, so a child can resolve its parent in the same pass.
  const ordered = [...data.categories].sort((a, b) => Number(!!a.parentSlug) - Number(!!b.parentSlug))

  for (const category of ordered) {
    const parent = category.parentSlug
      ? await prisma.category.findUnique({ where: { slug: category.parentSlug } })
      : null

    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        active: category.active,
        parentId: parent?.id ?? null,
        imageUrl: category.image ?? null,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        active: category.active,
        parentId: parent?.id ?? null,
        imageUrl: category.image ?? null,
      },
    })
  }
  console.log(`  categories      ${data.categories.length}`)
}

async function seedProducts() {
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } })
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]))

  for (const product of data.products) {
    const categoryId = categoryIdBySlug.get(product.categorySlug)
    if (!categoryId) throw new Error(`No category "${product.categorySlug}" for ${product.sku}`)

    const { categorySlug: _category, sourceUrl: _source, ...fields } = product

    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: { ...fields, categoryId },
      create: { ...fields, categoryId },
    })

    const image = productImages[product.sku]
    if (image) {
      const existing = await prisma.productImage.findFirst({
        where: { productId: saved.id, url: image.file },
      })

      if (!existing) {
        await prisma.productImage.create({
          data: { productId: saved.id, url: image.file, alt: image.alt, isPrimary: true, sortOrder: 0 },
        })
      }
    }
  }

  // Anything that used to be in the catalogue and no longer is becomes
  // inactive rather than deleted — orders and invoices still point at it.
  const retired = await prisma.product.updateMany({
    where: { sku: { notIn: data.products.map((product) => product.sku) }, active: true },
    data: { active: false },
  })

  const withPhotos = data.products.filter((product) => productImages[product.sku]).length

  console.log(`  products        ${data.products.length}  (${withPhotos} with photography)`)
  if (retired.count > 0) console.log(`  retired         ${retired.count} products no longer listed`)
}

async function seedQuantityBreaks() {
  for (const band of data.quantityBreaks) {
    const product = await prisma.product.findUnique({ where: { sku: band.sku } })
    if (!product) continue

    await prisma.quantityBreak.upsert({
      where: { productId_minQuantity: { productId: product.id, minQuantity: band.minQuantity } },
      update: { pricePence: band.pricePence },
      create: { productId: product.id, minQuantity: band.minQuantity, pricePence: band.pricePence },
    })
  }
  console.log(`  quantity breaks ${data.quantityBreaks.length}`)
}

async function seedStaff() {
  const passwordHash = await bcrypt.hash(STAFF_PASSWORD, 10)

  const staff = [
    { name: 'ANAID Administrator', email: 'admin@anaid.co.uk', roles: ['SUPER_ADMIN' as const] },
    { name: 'Sales Desk', email: 'sales@anaid.co.uk', roles: ['SALES_ADMIN' as const] },
    { name: 'Warehouse', email: 'warehouse@anaid.co.uk', roles: ['WAREHOUSE' as const, 'DELIVERY' as const] },
  ]

  for (const member of staff) {
    await prisma.staff.upsert({
      where: { email: member.email },
      update: { name: member.name, roles: member.roles, active: true },
      create: { ...member, passwordHash },
    })
  }
  console.log(`  staff           ${staff.length}  (password: ${STAFF_PASSWORD})`)
}

async function seedDemoCustomers() {
  const wholesale2 = await prisma.pricingLevel.findUnique({ where: { code: 'WS2' } })
  const now = new Date()

  // 1. An approved, trading customer — the state most screens are built for.
  const copperKettle = await prisma.customer.upsert({
    where: { email: 'orders@copperkettle.co.uk' },
    update: {},
    create: {
      customerNumber: 'ANAID-C00001',
      businessName: 'The Copper Kettle',
      contactName: 'Rowan Ellis',
      email: 'orders@copperkettle.co.uk',
      mobile: '07700900123',
      businessType: 'CAFE',
      postcode: 'E2 7DG',
      status: 'APPROVED',
      pricingLevelId: wholesale2?.id,
      creditLimitPence: 200_000,
      paymentTermsDays: 30,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      verifiedAt: now,
      approvedAt: now,
      users: {
        create: {
          name: 'Rowan Ellis',
          email: 'orders@copperkettle.co.uk',
          mobile: '07700900123',
          isPrimary: true,
        },
      },
      addresses: {
        create: {
          label: 'Café',
          line1: '14 Hackney Road',
          city: 'London',
          postcode: 'E2 7DG',
          isDefaultBilling: true,
          isDefaultDelivery: true,
          contactPhone: '07700900123',
        },
      },
    },
  })

  // 2. An applicant waiting in the approvals queue — the central rule in action.
  await prisma.customer.upsert({
    where: { email: 'hello@spicegarden.co.uk' },
    update: {},
    create: {
      businessName: 'Spice Garden Takeaway',
      contactName: 'Amara Shah',
      email: 'hello@spicegarden.co.uk',
      mobile: '07700900456',
      businessType: 'TAKEAWAY',
      postcode: 'M14 5TP',
      status: 'PENDING_APPROVAL',
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      verifiedAt: now,
      users: {
        create: {
          name: 'Amara Shah',
          email: 'hello@spicegarden.co.uk',
          mobile: '07700900456',
          isPrimary: true,
        },
      },
      addresses: {
        create: {
          line1: '88 Wilmslow Road',
          city: 'Manchester',
          postcode: 'M14 5TP',
          isDefaultBilling: true,
          isDefaultDelivery: true,
        },
      },
    },
  })

  // A negotiated price, so the pricing engine has something to prefer.
  // Whichever photographed product leads the catalogue, so the agreed price is
  // visible on a screen someone will actually look at.
  const cup = await prisma.product.findFirst({
    where: { active: true, featured: true },
    orderBy: { name: 'asc' },
  })
  if (cup) {
    await prisma.customerPrice.upsert({
      where: { customerId_productId: { customerId: copperKettle.id, productId: cup.id } },
      update: {},
      create: {
        customerId: copperKettle.id,
        productId: cup.id,
        pricePence: Math.round(cup.standardPricePence * 0.82),
        note: 'Agreed at account opening.',
      },
    })
  }

  console.log('  customers       2  (1 approved, 1 awaiting approval)')
}

async function seedCounters() {
  // One customer number has been issued above.
  await prisma.counter.upsert({ where: { key: 'customer' }, update: {}, create: { key: 'customer', value: 1 } })
  console.log('  counters        1')
}

async function main() {
  console.log('\nSeeding ANAID\n')
  await seedSettings()
  await seedPricingLevels()
  await seedCategories()
  await seedProducts()
  await seedQuantityBreaks()
  await seedStaff()
  await seedDemoCustomers()
  await seedCounters()
  console.log('\nDone.\n')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
