import { prisma } from './db'
import { applyDiscount } from './money'
import { canSeePrices } from './permissions'
import type { AccountStatus, PriceSource } from '../generated/prisma/client'

/**
 * The pricing engine (LEVEL-4 §13).
 *
 * Five candidate prices are computed — standard, pricing level, customer
 * specific, quantity break, promotion — and THE LOWEST WINS (gap #1, settled in
 * DECISIONS.md). The winning rule is returned alongside the number, so when a
 * customer questions an invoice the answer is in the order record itself.
 *
 * The six price-security checks of §13 are enforced as follows:
 *
 *   1. Authenticated               — the caller passes a session-derived customer.
 *   2. Linked to a customer record — same.
 *   3. Status is APPROVED          — asserted below; throws otherwise.
 *   4. Identifier matches the session — THE IMPORTANT ONE. This module accepts a
 *      customer object read from the session, never an id from a request. There
 *      is deliberately no overload that takes a customer id, so a handler cannot
 *      accidentally price an order for whoever the device claims to be.
 *   5. Permission to view prices   — canSeePrices(), asserted below.
 *   6. Correct rule applied        — this file.
 */

export class PricesNotAvailableError extends Error {
  constructor() {
    super('This account is not approved to see prices.')
    this.name = 'PricesNotAvailableError'
  }
}

/** Exactly the shape the session hands back. Never build one from user input. */
export type PricingCustomer = {
  id: string
  status: AccountStatus
  pricingLevelId: string | null
  pricingLevel: { discountBasisPoints: number } | null
}

export type PriceableProduct = {
  id: string
  categoryId: string
  standardPricePence: number
  minOrderQuantity: number
}

export type PriceBand = { minQuantity: number; pricePence: number }

export type PriceResult = {
  productId: string
  /** What this customer pays per unit at the quantity asked about. */
  unitPricePence: number
  /** Which rule produced it. */
  source: PriceSource
  /** List price, so a saving can be shown and audited. */
  standardPricePence: number
  /** The quantity the price was computed for. */
  quantity: number
  /** The band in force, if a break won or applies at this quantity. */
  appliedBand: PriceBand | null
  /**
   * The next band up, with what it would save per unit. Worth showing: it
   * measurably increases order sizes (LEVEL-4 §13).
   */
  nextBand: (PriceBand & { savingPerUnitPence: number }) | null
  /** All bands, for the product page's price ladder. */
  bands: PriceBand[]
}

type Candidate = { pricePence: number; source: PriceSource }

/**
 * Price a set of products for one customer in a fixed number of queries,
 * whatever the size of the set.
 */
export async function priceProducts(
  customer: PricingCustomer,
  products: PriceableProduct[],
  quantities?: Map<string, number>
): Promise<Map<string, PriceResult>> {
  // Checks 3 and 5. Defence in depth: the caller should already have used
  // requireApprovedCustomer, but the engine refuses regardless.
  if (!canSeePrices(customer.status)) {
    throw new PricesNotAvailableError()
  }

  const productIds = products.map((product) => product.id)
  if (productIds.length === 0) return new Map()

  const now = new Date()

  const [customerPrices, levelPrices, bands, promotions] = await Promise.all([
    prisma.customerPrice.findMany({
      where: {
        customerId: customer.id,
        productId: { in: productIds },
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
    }),
    customer.pricingLevelId
      ? prisma.productLevelPrice.findMany({
          where: { pricingLevelId: customer.pricingLevelId, productId: { in: productIds } },
        })
      : Promise.resolve([]),
    prisma.quantityBreak.findMany({
      where: { productId: { in: productIds } },
      orderBy: { minQuantity: 'asc' },
    }),
    prisma.promotion.findMany({
      where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    }),
  ])

  const customerPriceByProduct = new Map(customerPrices.map((row) => [row.productId, row.pricePence]))
  const levelPriceByProduct = new Map(levelPrices.map((row) => [row.productId, row.pricePence]))

  const bandsByProduct = new Map<string, PriceBand[]>()
  for (const band of bands) {
    const list = bandsByProduct.get(band.productId) ?? []
    list.push({ minQuantity: band.minQuantity, pricePence: band.pricePence })
    bandsByProduct.set(band.productId, list)
  }

  const results = new Map<string, PriceResult>()

  for (const product of products) {
    const quantity = Math.max(quantities?.get(product.id) ?? product.minOrderQuantity ?? 1, 1)
    const productBands = bandsByProduct.get(product.id) ?? []

    const candidates: Candidate[] = [
      { pricePence: product.standardPricePence, source: 'STANDARD' },
    ]

    // Step 3 — the customer's level. An explicit per-product price for that
    // level beats the percentage (DECISIONS.md, "Pricing").
    const explicitLevelPrice = levelPriceByProduct.get(product.id)
    if (explicitLevelPrice !== undefined) {
      candidates.push({ pricePence: explicitLevelPrice, source: 'PRICING_LEVEL' })
    } else if (customer.pricingLevel && customer.pricingLevel.discountBasisPoints > 0) {
      candidates.push({
        pricePence: applyDiscount(product.standardPricePence, customer.pricingLevel.discountBasisPoints),
        source: 'PRICING_LEVEL',
      })
    }

    // Step 2 — a rate negotiated with this customer for this product.
    const negotiated = customerPriceByProduct.get(product.id)
    if (negotiated !== undefined) {
      candidates.push({ pricePence: negotiated, source: 'CUSTOMER_SPECIFIC' })
    }

    // Step 4 — the bulk band in force at this quantity.
    const appliedBand = bandFor(productBands, quantity)
    if (appliedBand) {
      candidates.push({ pricePence: appliedBand.pricePence, source: 'QUANTITY_BREAK' })
    }

    // Step 5 — promotions. None are created in v1; the path exists so that
    // switching them on later changes nothing here.
    for (const promotion of promotions) {
      const applies =
        (promotion.productId && promotion.productId === product.id) ||
        (promotion.categoryId && promotion.categoryId === product.categoryId)
      if (!applies) continue

      candidates.push({
        pricePence:
          promotion.type === 'PERCENT_OFF'
            ? applyDiscount(product.standardPricePence, promotion.value)
            : promotion.value,
        source: 'PROMOTION',
      })
    }

    const winner = candidates.reduce((best, candidate) =>
      candidate.pricePence < best.pricePence ? candidate : best
    )

    const next = nextBandAbove(productBands, quantity)

    results.set(product.id, {
      productId: product.id,
      unitPricePence: winner.pricePence,
      source: winner.source,
      standardPricePence: product.standardPricePence,
      quantity,
      appliedBand,
      nextBand: next
        ? { ...next, savingPerUnitPence: Math.max(winner.pricePence - next.pricePence, 0) }
        : null,
      bands: productBands,
    })
  }

  return results
}

/** Convenience for the single-product case. */
export async function priceProduct(
  customer: PricingCustomer,
  product: PriceableProduct,
  quantity?: number
): Promise<PriceResult> {
  const map = await priceProducts(
    customer,
    [product],
    quantity ? new Map([[product.id, quantity]]) : undefined
  )
  return map.get(product.id)!
}

/** The band in force at a quantity: the highest whose minimum is reached. */
function bandFor(bands: PriceBand[], quantity: number): PriceBand | null {
  let applicable: PriceBand | null = null
  for (const band of bands) {
    if (quantity >= band.minQuantity) applicable = band
  }
  return applicable
}

/** The next band the customer has not yet reached. */
function nextBandAbove(bands: PriceBand[], quantity: number): PriceBand | null {
  for (const band of bands) {
    if (band.minQuantity > quantity) return band
  }
  return null
}

export const PRICE_SOURCE_LABELS: Record<PriceSource, string> = {
  STANDARD: 'List price',
  PRICING_LEVEL: 'Your pricing level',
  CUSTOMER_SPECIFIC: 'Your agreed price',
  QUANTITY_BREAK: 'Bulk price',
  PROMOTION: 'Promotion',
}

/** What appears where a price would be, for everyone who may not see one. */
export function priceWithheldMessage(status: AccountStatus | null): string {
  if (status === null || status === 'REGISTERED') return 'Log in and get approved to view price'
  return 'Price available after account approval'
}

/** The same thing, short enough for a product tile. */
export function priceWithheldShort(status: AccountStatus | null): string {
  if (status === null || status === 'REGISTERED') return 'Sign in for price'
  return 'Price after approval'
}

/**
 * Why the price is withheld, said to this particular viewer. A visitor is
 * invited to apply; someone who has already applied is not told to apply again.
 */
export function priceWithheldExplanation(status: AccountStatus | null): string {
  switch (status) {
    case null:
      return 'Wholesale prices are agreed per account. Open a trade account and we will approve it, usually within one working day.'
    case 'REGISTERED':
      return 'Enter the code we sent you to finish signing up. Prices appear once ANAID approves your account.'
    case 'PENDING_APPROVAL':
      return 'Your application is with ANAID. Prices appear here as soon as it is approved, usually within one working day.'
    case 'SUSPENDED':
      return 'Your account is suspended, so prices are hidden. Contact ANAID and we will put it right.'
    default:
      return 'Your account is not approved for trade prices. Contact ANAID if you think that is wrong.'
  }
}
