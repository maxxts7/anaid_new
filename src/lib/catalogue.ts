import { prisma } from './db'
import { catalogueViewer } from './auth/guards'
import { tidyName } from './text'
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

/**
 * Products for a listing. There is deliberately no category filter: the
 * catalogue is read whole and the tabs narrow it in the browser, which is what
 * makes moving between departments instant. Only a search — a genuinely
 * different question — comes back here.
 */
export async function listProducts(options: {
  search?: string
  featuredOnly?: boolean
  take?: number
} = {}) {
  const { search, featuredOnly, take } = options

  return prisma.product.findMany({
    where: {
      active: true,
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
        name: tidyName(category.name),
        slug: category.slug,
        imageUrl: category.imageUrl ?? borrowed,
        count,
        children: children
          .filter((child) => child._count.products > 0)
          .map((child) => ({ name: tidyName(child.name), slug: child.slug, count: child._count.products })),
      }
    })
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count)
}

/** One rail of the catalogue tabs: a top-level category and what sits under it. */
export type CatalogueGroup = {
  id: string
  name: string
  slug: string
  /** Everything in this category and beneath it, within the set being shown. */
  count: number
  /** How many are filed directly against the parent rather than a child. */
  looseCount: number
  children: { id: string; name: string; slug: string; count: number }[]
}

/**
 * Where one category sits in the two rails: which top-level tab owns it, and
 * which second-level tab beneath that, if any. A product filed straight onto a
 * parent has no child tab and belongs only to the parent's own panel.
 */
export type CategoryPath = { top: string; child: string | null }

/**
 * The two rails of category tabs, counted against a particular set of products.
 *
 * `categoryTree` counts the whole catalogue, which is the right number on the
 * home page and the wrong one above a search result: a customer who searched
 * "kraft" should see how many kraft lines are in Bags & Sheets, not how many
 * bags ANAID sells. So the counts here are derived from the products actually
 * being shown, and a category nobody in that set belongs to does not get a tab.
 *
 * `paths` comes back alongside so that the tabs and the products they filter
 * are decided by the same walk up the tree — the alternative, counting in one
 * place and filtering in another, is how a tab ends up promising eight products
 * and showing six.
 */
export async function catalogueGroups(
  products: { categoryId: string }[]
): Promise<{ groups: CatalogueGroup[]; paths: Record<string, CategoryPath> }> {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, slug: true, parentId: true },
  })

  const byId = new Map(categories.map((category) => [category.id, category]))

  // ANAID files a handful of products against a parent directly and the rest
  // against its children, so walk up recording the last two steps: the child
  // rail wants the second-level ancestor, the parent rail the root.
  const paths: Record<string, CategoryPath> = {}

  for (const category of categories) {
    const lineage: string[] = []
    let current: (typeof categories)[number] | undefined = category

    for (let depth = 0; current && depth < 6; depth++) {
      lineage.unshift(current.slug)
      if (!current.parentId) break
      current = byId.get(current.parentId)
    }

    if (lineage.length > 0) {
      paths[category.id] = { top: lineage[0], child: lineage[1] ?? null }
    }
  }

  const counts = new Map<string, number>()
  const bump = (slug: string) => counts.set(slug, (counts.get(slug) ?? 0) + 1)

  for (const product of products) {
    const path = paths[product.categoryId]
    if (!path) continue
    bump(path.top)
    if (path.child) bump(path.child)
  }

  return {
    paths,
    groups: categories
      .filter((category) => !category.parentId)
      .map((parent) => {
        const children = categories
          .filter((category) => category.parentId === parent.id)
          .map((child) => ({
            id: child.id,
            name: tidyName(child.name),
            slug: child.slug,
            count: counts.get(child.slug) ?? 0,
          }))
          .filter((child) => child.count > 0)

        const count = counts.get(parent.slug) ?? 0

        return {
          id: parent.id,
          name: tidyName(parent.name),
          slug: parent.slug,
          count,
          looseCount: count - children.reduce((total, child) => total + child.count, 0),
          children,
        }
      })
      .filter((group) => group.count > 0)
      .sort((a, b) => b.count - a.count),
  }
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
