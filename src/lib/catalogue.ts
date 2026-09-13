import { prisma } from './db'
import { catalogueViewer } from './auth/guards'
import type { AccountStatus } from '../generated/prisma/client'
import {
  priceProducts,
  priceWithheldExplanation,
  priceWithheldMessage,
  priceWithheldShort,
  type PriceResult,
} from './pricing'

/**
 * Reading the catalogue.
 *
 * The catalogue itself is public — a visitor may browse everything ANAID sells.
 * Prices are a separate question, answered only by `pricesFor`, which returns
 * nothing at all unless the viewer is an approved customer. No price is ever
 * fetched and then hidden.
 */

export const PRODUCT_LIST_SELECT = {
  id: true,
  sku: true,
  name: true,
  slug: true,
  description: true,
  packSize: true,
  unitsPerCarton: true,
  sellUnit: true,
  minOrderQuantity: true,
  standardPricePence: true,
  vatRateBasisPoints: true,
  stockOnHand: true,
  stockReserved: true,
  trackStock: true,
  featured: true,
  categoryId: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
}

export type ProductListItem = Awaited<ReturnType<typeof listProducts>>[number]

export async function listProducts(options: {
  search?: string
  categorySlug?: string
  featuredOnly?: boolean
  take?: number
} = {}) {
  const { search, categorySlug, featuredOnly, take } = options

  // ANAID's categories nest — "Food Container" has nine children. Choosing the
  // parent must show everything beneath it, not the handful filed directly.
  const categoryIds = categorySlug ? await categoryWithDescendants(categorySlug) : null

  return prisma.product.findMany({
    where: {
      active: true,
      categoryId: categoryIds ? { in: categoryIds } : undefined,
      featured: featuredOnly ? true : undefined,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { sku: { contains: search, mode: 'insensitive' as const } },
              { description: { contains: search, mode: 'insensitive' as const } },
              { barcode: search },
            ],
          }
        : {}),
    },
    select: PRODUCT_LIST_SELECT,
    orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    take,
  })
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    select: {
      ...PRODUCT_LIST_SELECT,
      barcode: true,
      brand: true,
      size: true,
      material: true,
      colour: true,
      cartonQuantity: true,
      lowStockThreshold: true,
      dimensions: true,
      weightGrams: true,
      images: { select: { url: true, alt: true }, orderBy: { sortOrder: 'asc' as const } },
    },
  })
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      parentId: true,
      _count: { select: { products: { where: { active: true } } } },
    },
  })
}

/** A category and everything filed beneath it, as ids. */
export async function categoryWithDescendants(slug: string): Promise<string[]> {
  const category = await prisma.category.findUnique({ where: { slug }, select: { id: true } })
  if (!category) return []

  const all = await prisma.category.findMany({ select: { id: true, parentId: true } })
  const ids = [category.id]

  // Two levels is all ANAID uses, but walk until nothing new appears.
  for (let depth = 0; depth < 5; depth++) {
    const next = all.filter((row) => row.parentId && ids.includes(row.parentId) && !ids.includes(row.id))
    if (next.length === 0) break
    ids.push(...next.map((row) => row.id))
  }

  return ids
}

export type CategoryTile = {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  count: number
  children: { name: string; slug: string; count: number }[]
}

/**
 * The top-level categories, each carrying the number of products in it and in
 * everything beneath it — the figure a customer expects to see.
 */
export async function categoryTree(): Promise<CategoryTile[]> {
  const categories = await listCategories()

  // Not every category has a banner of its own. Rather than leave a hole in an
  // otherwise photographic grid, borrow a picture from something inside it.
  const standIns = await prisma.productImage.findMany({
    where: { product: { active: true } },
    select: { url: true, product: { select: { categoryId: true } } },
    orderBy: { sortOrder: 'asc' },
  })

  const standInByCategory = new Map<string, string>()
  for (const image of standIns) {
    if (!standInByCategory.has(image.product.categoryId)) {
      standInByCategory.set(image.product.categoryId, image.url)
    }
  }

  const byParent = new Map<string, typeof categories>()

  for (const category of categories) {
    if (!category.parentId) continue
    const siblings = byParent.get(category.parentId) ?? []
    siblings.push(category)
    byParent.set(category.parentId, siblings)
  }

  return categories
    .filter((category) => !category.parentId)
    .map((category) => {
      const children = byParent.get(category.id) ?? []
      const count =
        category._count.products + children.reduce((total, child) => total + child._count.products, 0)

      const borrowed =
        standInByCategory.get(category.id) ??
        children.map((child) => standInByCategory.get(child.id)).find(Boolean) ??
        null

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        imageUrl: category.imageUrl ?? borrowed,
        count,
        children: children
          .filter((child) => child._count.products > 0)
          .map((child) => ({ name: child.name, slug: child.slug, count: child._count.products })),
      }
    })
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count)
}

export type CataloguePricing = {
  showPrices: boolean
  /** Empty when prices are withheld. */
  prices: Map<string, PriceResult>
  /** What to show in place of a price, worded for this viewer's status. */
  withheldMessage: string
  /** The same, short enough for a product tile. */
  withheldShort: string
  /** Why, in a sentence, said to this particular viewer. */
  withheldExplanation: string
  customerStatus: AccountStatus | null
}

/**
 * Prices for a set of products, for whoever is currently looking.
 *
 * The customer is taken from the session, never from an argument — that is
 * check four of the six price-security checks, and the one most often missed.
 */
export async function pricesFor(
  products: { id: string; categoryId: string; standardPricePence: number; minOrderQuantity: number }[],
  quantities?: Map<string, number>
): Promise<CataloguePricing> {
  const viewer = await catalogueViewer()

  if (!viewer.showPrices || !viewer.customer) {
    return {
      showPrices: false,
      prices: new Map(),
      withheldMessage: priceWithheldMessage(viewer.customer?.status ?? null),
      withheldShort: priceWithheldShort(viewer.customer?.status ?? null),
      withheldExplanation: priceWithheldExplanation(viewer.customer?.status ?? null),
      customerStatus: viewer.customer?.status ?? null,
    }
  }

  const prices = await priceProducts(viewer.customer, products, quantities)

  return {
    showPrices: true,
    prices,
    withheldMessage: '',
    withheldShort: '',
    withheldExplanation: '',
    customerStatus: viewer.customer.status,
  }
}

/** available = on hand − reserved. Untracked products are always available. */
export function availableStock(product: {
  trackStock: boolean
  stockOnHand: number
  stockReserved: number
}): number | null {
  if (!product.trackStock) return null
  return Math.max(0, product.stockOnHand - product.stockReserved)
}
